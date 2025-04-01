interface CameraPanelProps {
    isCameraControlFrozen: boolean;
    setIsCameraControlFrozen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CameraPanel = ({ isCameraControlFrozen, setIsCameraControlFrozen }: CameraPanelProps) => {
    return (
      <>
        <button
            className="w-full bg-gray-900 text-primary py-2 px-4 mt-5 rounded-md hover:text-gray-100 hover:bg-gray-800 transition-colors font-medium"
            onClick={() => setIsCameraControlFrozen(prev => !prev)}
        >
          {(isCameraControlFrozen ? "Unlock"  : "Lock") + " Camera"}
        </button>
      </>
    );
  };
  
export default CameraPanel;