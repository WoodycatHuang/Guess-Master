import { getAvatarEmoji } from '@shared/constants/avatars';
import type { Room, User } from '@shared/types/room';
import { Button } from './Button';

interface Props {
  room: Room;
  self: User;
  entryMessage?: string;
  onStart: () => void;
  onAddMock: () => void;
  onCopyLink: () => void;
  shareUrl: string;
}

export function RoomWaiting({
  room,
  self,
  entryMessage,
  onStart,
  onAddMock,
  onCopyLink,
  shareUrl,
}: Props) {
  const isHost = self.role === 'Host';
  const isSpectator = self.role === 'Spectator';
  const canStart = room.players.length >= 2;

  const sortedPlayers = [...room.players].sort((a, b) => a.joinedAt - b.joinedAt);

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

      <Button className="btn--block" variant="secondary" onClick={onCopyLink}>
        复制邀请链接
      </Button>
      <p className="hint share-url">{shareUrl}</p>

      {isHost ? (
        <div className="host-actions">
          <Button className="btn--block" disabled={!canStart} onClick={onStart}>
            开始游戏
          </Button>
          {!canStart ? (
            <p className="hint" style={{ textAlign: 'center' }}>
              至少需要 2 名玩家
            </p>
          ) : null}
          <Button className="btn--block" variant="secondary" onClick={onAddMock}>
            + 添加测试玩家
          </Button>
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
