import { useState } from 'react';
import { getAvatarEmoji } from '@shared/constants/avatars';
import type { Room, User } from '@shared/types/room';
import { Button } from './Button';

interface Props {
  room: Room;
  self: User;
  entryMessage?: string;
  onStart: () => void;
  onCopyLink: () => void;
  onLeave: () => void;
}

export function RoomWaiting({
  room,
  self,
  entryMessage,
  onStart,
  onCopyLink,
  onLeave,
}: Props) {
  const isHost = self.role === 'Host';
  const isSpectator = self.role === 'Spectator';
  const canStart = room.players.length >= 2;
  const [needPlayersOpen, setNeedPlayersOpen] = useState(false);

  const sortedPlayers = [...room.players].sort((a, b) => a.joinedAt - b.joinedAt);

  const handleStartClick = () => {
    if (!canStart) {
      setNeedPlayersOpen(true);
      return;
    }
    onStart();
  };

  return (
    <>
      {entryMessage ? (
        <div className="toast-error" style={{ borderColor: '#ff0055' }}>
          {entryMessage}
          <div className="hint" style={{ marginTop: 4 }}>
            你正在旁观
          </div>
        </div>
      ) : null}

      <h2 className="section-title">{isSpectator ? '观战中' : '等待开始'}</h2>
      <p className="hint hint--ok" style={{ textAlign: 'center', marginBottom: 16 }}>
        {room.players.length}/10 玩家
        {room.spectators.length > 0 ? ` · ${room.spectators.length} 旁观` : ''}
      </p>

      <div className="player-grid">
        {sortedPlayers.map((u) => (
          <div key={u.id} className="player-cell">
            <div
              className={`player-avatar-box${u.id === room.hostId ? ' player-avatar-box--host' : ''}`}
            >
              <span className="player-emoji-lg">{getAvatarEmoji(u.avatarId)}</span>
              {u.id === room.hostId ? <span className="host-dot">H</span> : null}
            </div>
            <span className="player-cell-name">
              {u.name}
              {self.id === u.id ? '（我）' : ''}
            </span>
          </div>
        ))}
      </div>

      <div className="room-action-stack">
        <Button variant="secondary" onClick={onCopyLink}>
          复制邀请链接
        </Button>

        {isHost ? (
          <Button
            className={canStart ? '' : 'btn--looks-disabled'}
            onClick={handleStartClick}
          >
            开始游戏
          </Button>
        ) : null}

        <Button variant="secondary" onClick={onLeave}>
          离开房间
        </Button>
      </div>

      {needPlayersOpen ? (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="need-players-title"
          onClick={() => setNeedPlayersOpen(false)}
        >
          <div className="modal panel" onClick={(e) => e.stopPropagation()}>
            <h2 id="need-players-title" className="modal-title">
              无法开始
            </h2>
            <p className="hint" style={{ marginBottom: 16, textAlign: 'center' }}>
              至少需要 2 名玩家才能开始游戏
            </p>
            <Button className="btn--block" onClick={() => setNeedPlayersOpen(false)}>
              知道了
            </Button>
          </div>
        </div>
      ) : null}

      {self.role === 'Guest' ? (
        <div className="panel panel--muted">
          <p className="hint hint--ok" style={{ margin: 0, textAlign: 'center' }}>
            等待房主开启游戏…
          </p>
        </div>
      ) : null}

      {isSpectator ? (
        <div className="panel panel--muted">
          <p className="hint hint--ok" style={{ margin: 0, textAlign: 'center' }}>
            游戏尚未开始，请观战
          </p>
        </div>
      ) : null}
    </>
  );
}
