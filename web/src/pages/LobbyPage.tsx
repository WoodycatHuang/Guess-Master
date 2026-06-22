import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRoomSync } from '@shared/hooks/useRoomSync';
import { isRemoteSyncEnabled, getSyncBaseUrl } from '@shared/services/sync';
import { pingSyncServer } from '@shared/services/sync/RemoteSyncService';
import { AvatarGrid } from '../components/AvatarGrid';
import { Button } from '../components/Button';
import { loadProfile, persistSession, saveProfile } from '../lib/storage';

export default function LobbyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createRoom, joinRoom } = useRoomSync(null);

  const [nickname, setNickname] = useState('');
  const [avatarId, setAvatarId] = useState(1);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [syncOk, setSyncOk] = useState<boolean | null>(null);

  useEffect(() => {
    const url = getSyncBaseUrl();
    if (!url) {
      setSyncOk(false);
      return;
    }
    void pingSyncServer(url).then(setSyncOk);
  }, []);

  useEffect(() => {
    const profile = loadProfile();
    setNickname(profile.nickname);
    setAvatarId(profile.avatarId || 1);
    const fromLink = searchParams.get('room');
    if (fromLink) setRoomIdInput(fromLink.toUpperCase());
  }, [searchParams]);

  const profile = () => {
    const p = { name: nickname.trim(), avatarId };
    saveProfile({ nickname: p.name, avatarId: p.avatarId });
    return p;
  };

  const enterRoom = (roomId: string, selfId: string, message?: string) => {
    persistSession(selfId, roomId);
    navigate(`/room/${roomId}`, { state: message ? { entryMessage: message } : undefined });
  };

  const handleCreate = async () => {
    if (!nickname.trim()) {
      setError('请先输入昵称，再点创建房间');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const result = await createRoom(profile());
      if (!result?.room?.roomId || !result?.self?.id) {
        throw new Error('服务器返回异常，请检查页面底部联机状态');
      }
      enterRoom(result.room.roomId, result.self.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败');
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }
    if (!roomIdInput.trim()) {
      setError('请输入房间号');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const result = await joinRoom({
        ...profile(),
        roomId: roomIdInput.trim(),
      });
      if ('code' in result) {
        setError(result.message);
        return;
      }
      enterRoom(result.room.roomId, result.self.id, result.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加入失败');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page">
      <header className="logo-block">
        <h1 className="logo-title">猜测大师</h1>
        <p className="logo-sub">Guess Master</p>
      </header>

      <div className="panel">
        {error ? <div className="toast-error">{error}</div> : null}

        <label className="field-label" htmlFor="nickname">
          你的昵称
        </label>
        <input
          id="nickname"
          className="text-input"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="输入昵称"
          maxLength={12}
          autoComplete="nickname"
        />

        <p className="field-label" style={{ marginTop: 16 }}>
          选择头像
        </p>
        <AvatarGrid
          selectedId={avatarId}
          onSelect={(id) => {
            setAvatarId(id);
            saveProfile({ nickname, avatarId: id });
          }}
        />

        <div className="row">
          <input
            className="text-input text-input--room"
            value={roomIdInput}
            onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
            placeholder="房间号"
            maxLength={6}
            aria-label="房间号"
          />
          <Button variant="secondary" onClick={handleJoin} disabled={busy}>
            {busy ? '处理中…' : '加入'}
          </Button>
        </div>

        <Button className="btn--block" onClick={handleCreate} disabled={busy}>
          {busy ? '创建中…' : '创建房间'}
        </Button>
      </div>

      <p className="hint hint--ok">
        {isRemoteSyncEnabled()
          ? syncOk === true
            ? `联机正常 · ${getSyncBaseUrl()}`
            : syncOk === false
              ? `联机不可用 · 请检查 ${getSyncBaseUrl()}（本地需 npm run sync-server）`
              : '正在检测联机…'
          : '未配置联机地址，请检查 web/.env.development 中的 VITE_SYNC_URL'}
      </p>
    </main>
  );
}
