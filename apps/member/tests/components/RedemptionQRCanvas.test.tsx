import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RedemptionQRCanvas } from '@/components/member/RedemptionQRCanvas';

const toCanvasMock = vi.fn().mockResolvedValue(undefined);

vi.mock('qrcode', () => ({
  default: {
    toCanvas: (...args: unknown[]) => toCanvasMock(...args),
  },
}));

describe('RedemptionQRCanvas', () => {
  beforeEach(() => {
    toCanvasMock.mockClear();
  });

  it('renders a <canvas> element', () => {
    const { container } = render(
      <RedemptionQRCanvas qrData="test-qr-data" code="AB-1234" />
    );
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('displays the code prop as text', () => {
    render(<RedemptionQRCanvas qrData="test-qr-data" code="AB-1234" />);
    expect(screen.getByText('AB-1234')).toBeInTheDocument();
  });

  it('calls QRCode.toCanvas with the qrData prop on mount', async () => {
    render(<RedemptionQRCanvas qrData="some-qr-payload" code="XY-5678" />);
    // useEffect runs synchronously in jsdom after render
    expect(toCanvasMock).toHaveBeenCalledTimes(1);
    expect(toCanvasMock).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      'some-qr-payload',
      { width: 148, margin: 1 }
    );
  });
});
