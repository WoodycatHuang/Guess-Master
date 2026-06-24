import { useLocation, useNavigate } from 'react-router-dom';
import { BrandHeader } from '../components/BrandHeader';

export default function HowToPlayPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const handleBack = () => {
    if (from && from !== '/how-to-play') {
      navigate(from);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };

  return (
    <main className="page page--how-to">
      <div className="page-header">
        <button type="button" className="header-link" onClick={handleBack}>
          ← 返回
        </button>
        <span className="status-pill status-pill--active">玩法说明</span>
      </div>

      <BrandHeader variant="compact" showLogo={false} />

      <div className="how-to-panel panel">
        <h2 className="how-to-heading">这是什么游戏？</h2>
        <p className="how-to-text">
          <strong>Guess Master（脑波专家）</strong>
          是一款多人联机派对游戏。每人拿到{' '}
          <strong>1 张</strong>（困难模式下是 <strong>2 张</strong>）
          <strong>只有自己可以看到的卡牌</strong>，卡牌上有一个数字。大家要依据
          <strong>本局话题</strong>，用<strong>名词</strong>来描述你手中的卡牌——
          <strong>不要说数字</strong>，也<strong>尽量不要用形容词</strong>。
          <strong>房主</strong>根据大家的描述，把所有人<strong>从低到高</strong>
          排好序。最后<strong>依次翻牌</strong>，数字必须<strong>严格递增</strong>
          ——排对了就赢。
        </p>
      </div>

      <div className="how-to-panel panel">
        <h2 className="how-to-heading">简单模式 vs 困难模式</h2>
        <div className="how-to-table-wrap">
          <table className="how-to-table">
            <thead>
              <tr>
                <th scope="col" />
                <th scope="col">简单模式</th>
                <th scope="col">困难模式</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">每人牌数</th>
                <td>1 张</td>
                <td>2 张（绿边 / 青边各一张）</td>
              </tr>
              <tr>
                <th scope="row">人数限制</th>
                <td>2～10 人</td>
                <td>2～5 人</td>
              </tr>
              <tr>
                <th scope="row">排序方式</th>
                <td>每人 1 个位置</td>
                <td>每人 2 个位置，两张牌都要排进顺序</td>
              </tr>
              <tr>
                <th scope="row">描述方式</th>
                <td>用名词描述 1 张牌</td>
                <td>两张牌分别用名词描述</td>
              </tr>
              <tr>
                <th scope="row">翻牌验证</th>
                <td>从左到右依次翻开，必须递增</td>
                <td>每张牌都要比前一张大</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="how-to-text how-to-text--muted">
          房主在等人齐后点「开始游戏」，会弹出难度选择；只有 ≤5 人时才能选困难模式。
        </p>
      </div>

      <div className="how-to-panel panel panel--accent">
        <h2 className="how-to-heading">举例：怎么描述你的牌？</h2>
        <p className="how-to-text">
          本局话题：<strong>「世界上最美丽的人」</strong>
        </p>
        <p className="how-to-text hint hint--ok">
          0 = 非常丑 ← → 100 = 非常漂亮
        </p>
        <ul className="how-to-list">
          <li>
            分数很高，比如 <strong>98</strong> → 可以说：<strong>「白雪公主」</strong>
          </li>
          <li>
            分数很低，比如 <strong>5</strong> → 可以说：<strong>「卡西莫多」</strong>
          </li>
        </ul>
        <p className="how-to-text how-to-text--muted">
          房主会把大家从「更像卡西莫多」排到「更像白雪公主」——全程不要报出 98、5 这些数字。
        </p>
      </div>

      <div className="how-to-panel panel">
        <h2 className="how-to-heading">怎么开始一局？</h2>
        <ol className="how-to-steps">
          <li>
            <strong>进入大厅</strong> — 输入昵称、选头像，创建或加入房间
          </li>
          <li>
            <strong>等人到齐</strong> — 房主发邀请链接，至少 2 人
          </li>
          <li>
            <strong>选难度并开始</strong> — 房主点「开始游戏」，选简单或困难
          </li>
        </ol>
      </div>

      <div className="how-to-panel panel">
        <h2 className="how-to-heading">游戏里怎么玩？</h2>
        <ol className="how-to-steps">
          <li>
            <strong>看话题</strong> — 本局比的是什么，哪边低、哪边高
          </li>
          <li>
            <strong>看自己的牌</strong> — 只有你能看到；困难模式有 2 个数字
          </li>
          <li>
            <strong>用名词描述</strong> — 像白雪公主 / 卡西莫多那样给线索
          </li>
          <li>
            <strong>房主排序</strong> — 从低到高拖动；其他人可实时看到
          </li>
          <li>
            <strong>提交并翻牌</strong> — 数字必须严格递增
          </li>
          <li>
            <strong>看结果</strong> — 全对成功，有错则失败（错处标红）
          </li>
          <li>
            <strong>再来一局</strong> — 回等待页，房主再次开始
          </li>
        </ol>
      </div>

      <div className="how-to-panel panel">
        <h2 className="how-to-heading">角色说明</h2>
        <ul className="how-to-list">
          <li>
            <strong>房主</strong> — 开房、开始游戏、排序、提交
          </li>
          <li>
            <strong>玩家</strong> — 看自己的牌、说线索、看排序与翻牌
          </li>
          <li>
            <strong>旁观</strong> — 满员或进行中加入时，只能观看
          </li>
        </ul>
      </div>

      <div className="how-to-panel panel panel--muted">
        <h2 className="how-to-heading">小提示</h2>
        <ul className="how-to-list">
          <li>
            <strong>用名词，少用形容词</strong> — 「白雪公主」比「很漂亮」更有用
          </li>
          <li>
            <strong>困难模式</strong> — 两张牌要分开描述，排序里会出现两次
          </li>
          <li>
            离开请点 <strong>「退回大厅」</strong>，方便其他人看到
          </li>
          <li>
            房主<strong>不必</strong>再点自己的邀请链接 — 链接只发给朋友即可
          </li>
        </ul>
      </div>

      <button type="button" className="btn btn--block btn--secondary" onClick={handleBack}>
        返回游戏
      </button>
    </main>
  );
}
