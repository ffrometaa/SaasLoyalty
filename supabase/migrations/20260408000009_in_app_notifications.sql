-- In-App Notifications
-- Adds read_at column + auto-creation triggers for transaction events and tier upgrades

-- ── 1. read_at column ────────────────────────────────────────────────────────

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_notifications_member_inapp
  ON notifications (member_id, channel, created_at DESC)
  WHERE channel = 'in_app';

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications (member_id)
  WHERE channel = 'in_app' AND read_at IS NULL;

-- ── 2. RLS: members can read/update their own in-app notifications ────────────

-- Allow members to mark their own notifications as read
DROP POLICY IF EXISTS notifications_member_update_read ON notifications;
CREATE POLICY notifications_member_update_read ON notifications
  FOR UPDATE USING (
    member_id IN (
      SELECT id FROM members WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    member_id IN (
      SELECT id FROM members WHERE auth_user_id = auth.uid()
    )
  );

-- ── 3. Helper: insert an in_app notification ─────────────────────────────────

CREATE OR REPLACE FUNCTION create_in_app_notification(
  p_tenant_id  UUID,
  p_member_id  UUID,
  p_type       TEXT,
  p_title      TEXT,
  p_content    TEXT,
  p_data       JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO notifications (
    tenant_id, member_id, channel, type, subject, title, content,
    status, sent_at, data
  ) VALUES (
    p_tenant_id, p_member_id, 'in_app', p_type, p_title, p_title, p_content,
    'delivered', now(), p_data
  );
END;
$$;

-- ── 4. Trigger: create in-app notification on transaction INSERT ──────────────

CREATE OR REPLACE FUNCTION fn_transaction_in_app_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_title   TEXT;
  v_content TEXT;
  v_title_en TEXT;
  v_pts     INT := ABS(NEW.points);
BEGIN
  CASE NEW.type
    WHEN 'earn' THEN
      v_title    := '¡Puntos acreditados!';
      v_content  := 'Ganaste ' || v_pts || ' puntos. Saldo actual: ' || NEW.balance_after || ' pts.';
      v_title_en := 'Points added!';
    WHEN 'redeem' THEN
      v_title    := 'Premio canjeado';
      v_content  := 'Usaste ' || v_pts || ' puntos. Saldo restante: ' || NEW.balance_after || ' pts.';
      v_title_en := 'Reward redeemed';
    WHEN 'birthday' THEN
      v_title    := '¡Feliz cumpleaños! 🎂';
      v_content  := 'Te regalamos ' || v_pts || ' puntos por tu cumpleaños.';
      v_title_en := 'Happy Birthday! 🎂';
    WHEN 'referral' THEN
      v_title    := '¡Bonus de referido! 🎉';
      v_content  := 'Ganaste ' || v_pts || ' puntos por tu referido.';
      v_title_en := 'Referral bonus! 🎉';
    WHEN 'expire' THEN
      v_title    := 'Puntos vencidos';
      v_content  := v_pts || ' puntos vencieron. Visitanos para seguir acumulando.';
      v_title_en := 'Points expired';
    WHEN 'adjustment' THEN
      IF NEW.points > 0 THEN
        v_title    := 'Ajuste de puntos';
        v_content  := 'Se agregaron ' || v_pts || ' puntos a tu cuenta.';
        v_title_en := 'Points adjustment';
      ELSE
        v_title    := 'Ajuste de puntos';
        v_content  := 'Se descontaron ' || v_pts || ' puntos de tu cuenta.';
        v_title_en := 'Points adjustment';
      END IF;
    ELSE
      RETURN NEW; -- skip bonus, refund, etc.
  END CASE;

  PERFORM create_in_app_notification(
    NEW.tenant_id,
    NEW.member_id,
    NEW.type,
    v_title,
    v_content,
    jsonb_build_object(
      'title_en', v_title_en,
      'points',   NEW.points,
      'balance',  NEW.balance_after
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_transaction_in_app ON transactions;

CREATE TRIGGER trg_transaction_in_app
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION fn_transaction_in_app_notification();

-- ── 5. Trigger: in-app notification on tier upgrade ──────────────────────────

CREATE OR REPLACE FUNCTION fn_tier_upgrade_in_app_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_title    TEXT;
  v_content  TEXT;
  v_title_en TEXT;
BEGIN
  -- Only fire when tier actually changed upward
  IF NEW.tier = OLD.tier THEN RETURN NEW; END IF;

  CASE NEW.tier
    WHEN 'silver' THEN
      v_title    := '¡Alcanzaste el nivel Silver! 🥈';
      v_content  := 'Felicitaciones, subiste a Silver. Seguí acumulando puntos.';
      v_title_en := 'You reached Silver tier! 🥈';
    WHEN 'gold' THEN
      v_title    := '¡Alcanzaste el nivel Gold! 🥇';
      v_content  := 'Increíble, subiste a Gold. Disfrutá tus beneficios exclusivos.';
      v_title_en := 'You reached Gold tier! 🥇';
    WHEN 'platinum' THEN
      v_title    := '¡Sos Platinum! 💎';
      v_content  := 'El nivel más alto. Gracias por tu fidelidad.';
      v_title_en := 'You are Platinum! 💎';
    ELSE
      RETURN NEW;
  END CASE;

  PERFORM create_in_app_notification(
    NEW.tenant_id,
    NEW.id,
    'tier_upgrade',
    v_title,
    v_content,
    jsonb_build_object(
      'title_en',  v_title_en,
      'new_tier',  NEW.tier,
      'old_tier',  OLD.tier
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tier_upgrade_in_app ON members;

CREATE TRIGGER trg_tier_upgrade_in_app
  AFTER UPDATE OF tier ON members
  FOR EACH ROW
  WHEN (NEW.tier IS DISTINCT FROM OLD.tier)
  EXECUTE FUNCTION fn_tier_upgrade_in_app_notification();

-- ── Verify ───────────────────────────────────────────────────────────────────
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read_at';
-- SELECT * FROM notifications WHERE channel = 'in_app' ORDER BY created_at DESC LIMIT 5;
