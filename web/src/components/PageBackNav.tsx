interface Props {
  roomId?: string;
  onLeave: () => void;
}

/** 固定左上角，与右上角「玩法说明」同一水平线 */
export function PageBackNav({ roomId, onLeave }: Props) {
  return (
    <div className={`page-back-nav${roomId ? ' page-back-nav--with-room' : ''}`}>
      <button type="button" className="page-back-nav__btn" onClick={onLeave}>
        ← 退回大厅
      </button>
      {roomId ? <p className="page-back-nav__room">房间号：{roomId}</p> : null}
    </div>
  );
}
