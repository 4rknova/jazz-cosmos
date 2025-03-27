import { QRCodeSVG } from "qrcode.react";
import { CursorFeed } from "../schema";
interface InfoPanelProps {
  worldURL: string;
  cursorFeed: CursorFeed;
  worldName: string;
}

const InfoPanel = ({ worldURL, cursorFeed, worldName }: InfoPanelProps) => {
  return (
    <>
        <h1 className="text-primary text-2xl font-bold mb-5">{worldName}</h1>
        <QRCodeSVG
          id="world-qr-code-svg"
          value={worldURL}
          size={128}
          bgColor="transparent"
          fgColor="#5e7f9b"
        />
        <p className="text-primary mt-10 font-bold text-sm">PLAYERS: { Object.keys(cursorFeed?.perSession ?? {}).length ?? 0}</p>
        <button
            className="w-full bg-gray-900 text-primary py-2 px-4 mt-5 rounded-md hover:text-gray-100 hover:bg-gray-800 transition-colors font-medium"
            onClick={() => {
                window.open(worldURL, "_blank");
                navigator.clipboard.writeText(worldURL);
            }}
        >
          open in new tab
        </button>
    </>
  );    
};

export default InfoPanel;