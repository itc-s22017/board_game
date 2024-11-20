type WinnerAnnouncementProps = {
    winner: 'red' | 'blue' ,
    onDismiss: () => void;
};

const WinnerAnnouncement = ({ winner, onDismiss }: WinnerAnnouncementProps) => {

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center" onClick={onDismiss}>
            <div className="animate-bounce bg-white p-10 rounded-lg shadow-xl text-3xl">
            {winner}
            </div>
        </div>
    );
};

export default WinnerAnnouncement;