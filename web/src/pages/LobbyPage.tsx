import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRoomSync } from '@shared/hooks/useRoomSync';
import { roomSync } from '@shared/services/sync';
import { findExistingMember } from '@shared/services/sync/memberLookup';
import { normalizeRoomId } from '@shared/services/sync/roomKeys';
import { AvatarGrid } from '../components/AvatarGrid';
import { BrandHeader } from '../components/BrandHeader';
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
  const linkJoinStarted = useRef(false);

  useEffect(() => {
    const profile = loadProfile();
    setNickname(profile.nickname);
    setAvatarId(profile.avatarId || 1);
    const fromLink = searchParams.get('room');
    if (fromLink) setRoomIdInput(fromLink.toUpperCase());
  }, [searchParams]);

  /** 邀请链接：老玩家回房间，新玩家自动加入（无需再点「加入」） */
  useEffect(() => {
    const fromLink = searchParams.get('room');
    if (!fromLink || !nickname.trim() || linkJoinStarted.current) return;

    const roomId = normalizeRoomId(fromLink);
    const stored = loadProfile();
    linkJoinStarted.current = true;

    void (async () => {
      try {
        const snapshot = await roomSync.fetchRoom(roomId);
        if (!snapshot) {
          setError('房间不存在或已解散');
          linkJoinStarted.current = false;
          return;
        }

        const existing = findExistingMember(snapshot, nickname, stored.userId);
        if (existing) {
          enterRoom(roomId, existing.id);
          return;
        }

        setBusy(true);
        setError('');
        const p = profile();
        const result = await joinRoom({
          ...p,
          roomId,
          userId: stored.userId,
        });
        if ('code' in result) {
          setError(result.message);
          linkJoinStarted.current = false;
          return;
        }
        enterRoom(result.room.roomId, result.self.id, result.message);
      } catch (e) {
        setError(e instanceof Error ? e.message : '加入失败');
        linkJoinStarted.current = false;
      } finally {
        setBusy(false);
      }
    })();
  }, [searchParams, nickname, avatarId, navigate, joinRoom]);

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
      const roomId = normalizeRoomId(roomIdInput.trim());
      const stored = loadProfile();
      const p = profile();

      const snapshot = await roomSync.fetchRoom(roomId);
      if (snapshot) {
        const existing = findExistingMember(snapshot, p.name, stored.userId);
        if (existing) {
          enterRoom(roomId, existing.id);
          return;
        }
      }

      const result = await joinRoom({
        ...p,
        roomId,
        userId: stored.userId,
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
      <BrandHeader />

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
    </main>
  );
}
