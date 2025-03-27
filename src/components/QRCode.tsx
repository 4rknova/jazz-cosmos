import { QRCodeSVG } from "qrcode.react";

type QRCodeGeneratorProps = {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  includeMargin?: boolean;
};

export default function QRCodeGenerator({
  value,
  size = 256,
  fgColor = "#000000",
  bgColor = "#ffffff",
  includeMargin = false,
}: QRCodeGeneratorProps) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      fgColor={fgColor}
      bgColor={bgColor}
      includeMargin={includeMargin}
      level="M" // Error correction level: L, M, Q, H
    />
  );
}