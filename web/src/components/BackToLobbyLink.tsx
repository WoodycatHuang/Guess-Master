interface Props {
  label?: string;
  onLeave: () => void;
}

/** 退回大厅：必须先 leaveRoom，不能直接用 React Router Link */
export function BackToLobbyLink({ label = '退回大厅', onLeave }: Props) {
  return (
    <button type="button" className="header-link" onClick={onLeave}>
      {label}
    </button>
  );
}
