// src/components/post/PostCard.jsx
import React, { useState, useEffect } from "react";
import "./PostCard.css";
import { FaHeart, FaBookmark } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import baseApi from "../../api/baseApi";
import { RiNextjsFill } from "react-icons/ri";

// ✅ 내 액션(색 유지)을 위한 세션 캐시

const readActions = (userId) => {
  const key = `articleActions:${userId}`;
  try {
    return JSON.parse(sessionStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
};

const writeActions = (userId, obj) => {
  try {
    const key = `articleActions:${userId}`;
    sessionStorage.setItem(key, JSON.stringify(obj));
  } catch {}
};

const patchArticleCache = (userId, id, patch) => {
  const map = readActions(userId);
  map[String(id)] = { ...(map[String(id)] || {}), ...patch, ts: Date.now() };
  writeActions(userId, map);
};

const PostCard = ({ post, onPatch }) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(
    sessionStorage.getItem("userId") || null
  );
  // 표시/카운트 상태
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [bookmarkCount, setBookmarkCount] = useState(post.scrapCount ?? 0);

  // 서버/부모가 주는 값(없을 수도 있으니 안전하게)
  const likedFromProps = !!(post.isLiked ?? post.liked ?? post.isLike);
  const bookmarkedFromProps = !!(
    post.isScraped ??
    post.scraped ??
    post.bookmarked
  );

  // 👉 props로 1차 동기화 후, 세션 캐시(내 액션)로 최종 오버라이드 → 뒤로가도 색 유지
  useEffect(() => {
    const fetchUserActions = async () => {
      const currentUserId = sessionStorage.getItem("userId");
      if (!currentUserId) return;

      setUserId(currentUserId);

      const token = sessionStorage.getItem("accessToken");
      if (!token) return;

      try {
        const res = await baseApi.get(`/users/${currentUserId}/actions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const actions = res.data; // { articleId: { liked, scrapped, likeCount, scrapCount } }
        const cached =
          actions[post.id] || readActions(currentUserId)[post.id] || {};

        setLiked(cached.liked ?? post.isLiked ?? false);
        setBookmarked(cached.scrapped ?? post.isScraped ?? false);
        setLikeCount(cached.likeCount ?? post.likeCount ?? 0);
        setBookmarkCount(cached.scrapCount ?? post.scrapCount ?? 0);

        patchArticleCache(currentUserId, post.id, cached);
      } catch (err) {
        console.error("사용자 액션 불러오기 실패", err);
      }
    };

    fetchUserActions();
  }, [post.id, post.likeCount, post.scrapCount]);

  const handleCardClick = () => navigate(`/post/${post.id}`);

  const handleProfileClick = (e) => {
    e.stopPropagation();
    const authorId = post.author?.id || post.authorId;
    if (authorId) navigate(`/profile/${authorId}`);
  };

  const safeGetToken = () => {
    try {
      if (typeof window !== "undefined") {
        return sessionStorage.getItem("accessToken");
      }
    } catch {}
    return null;
  };

  // 좋아요 토글 (성공 시 세션에 내 상태 저장 → 뒤로가도 유지)
  const toggleLike = async (e) => {
    e.stopPropagation();
    const token = safeGetToken();
    if (!token) return alert("로그인이 필요합니다.");

    try {
      if (!liked) {
        // 좋아요 추가
        await baseApi.post(
          `/articles/${post.id}/likes`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setLiked(true);
        setLikeCount((prev) => prev + 1);
        patchArticleCache(userId, post.id, {
          liked: true,
          likeCount: likeCount + 1,
        });
      } else {
        // 좋아요 취소
        await baseApi.delete(`/articles/${post.id}/likes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
        patchArticleCache(userId, post.id, {
          liked: false,
          likeCount: Math.max(0, likeCount - 1),
        });
      }
    } catch (err) {
      console.error("좋아요 서버 저장 실패", err);
      alert("좋아요 처리 중 오류가 발생했습니다.");
    }
  };

  const toggleBookmark = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    const token = safeGetToken();
    if (!token) return alert("로그인이 필요합니다. (스크랩)");

    try {
      if (!bookmarked) {
        // 스크랩 추가
        await baseApi.post(
          `/articles/${post.id}/scraps`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setBookmarked(true);
        setBookmarkCount((prev) => {
          const next = prev + 1;
          patchArticleCache(userId, post.id, {
            isScraped: true,
            scrapCount: next,
          });
          return next;
        });
      } else {
        // 스크랩 취소
        await baseApi.delete(`/articles/${post.id}/scraps`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBookmarked(false);
        setBookmarkCount((prev) => {
          const next = Math.max(0, prev - 1);
          patchArticleCache(userId, post.id, {
            isScraped: false,
            scrapCount: next,
          });
          return next;
        });
      }
    } catch (err) {
      console.error("스크랩 서버 저장 실패", err);
      alert("스크랩 처리 중 오류가 발생했습니다.");
    }
  };

  // 스크랩 토글 (성공 시 세션에 내 상태 저장 → 뒤로가도 유지)

  const tagMap = {
    RESTAURANT: "맛집",
    CAFE: "카페",
    TRAVEL_SPOT: "여행지",
  };

  const formatDate = (dateString) => {
    if (!dateString) return "날짜 없음";
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return "날짜 없음";
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}년 ${m}월 ${day}일`;
    } catch {
      return "날짜 없음";
    }
  };

  const getAuthorName = () =>
    post.author?.nickname || post.author?.name || post.authorName || "익명";

  const handleImageError = (e) => {
    if (e.target.src.includes("default-image.png")) return;
    e.target.src = "/default-image.png";
  };

  const handleProfileImageError = (e) => {
    if (e.target.src.includes("default-profile.png")) return;
    e.target.src = "/default-profile.png";
  };

  const truncateTitle = (title, maxLength = 60) => {
    if (!title) return "제목 없음";
    return title.length > maxLength
      ? `${title.substring(0, maxLength)}...`
      : title;
  };

  const formatCount = (count) => {
    if (count >= 1_000_000) return (count / 1_000_000).toFixed(1) + "M";
    if (count >= 1_000) return (count / 1_000).toFixed(1) + "K";
    return String(count ?? 0);
  };

  const handleLikeToggle = async (postId, isLiked) => {
    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      if (isLiked) {
        // 좋아요 취소
        await baseApi.delete(`/api/articles/${postId}/likes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // 좋아요 추가
        await baseApi.post(
          `/api/articles/${postId}/likes`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      // 로컬 상태 업데이트 (id 기준으로 찾아서 바꿈)
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                liked: !isLiked,
                likeCount: isLiked ? p.likeCount - 1 : p.likeCount + 1,
              }
            : p
        )
      );
    } catch (err) {
      console.error("좋아요 토글 실패:", err);
    }
  };

  // 스크랩 토글
  const handleScrapToggle = async (postId, isScrapped) => {
    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      if (isScrapped) {
        await baseApi.delete(`/api/articles/${postId}/scraps`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await baseApi.post(
          `/api/articles/${postId}/scraps`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, scrapped: !isScrapped } : p))
      );
    } catch (err) {
      console.error("스크랩 토글 실패:", err);
    }
  };
  return (
    <div className="post-card" onClick={handleCardClick}>
      {/* 상단 이미지 섹션 */}
      <div className="post-header">
        <div
          className={`post-images ${
            post.places?.length === 1 ? "single-image" : ""
          }`}
        >
          <img
            src={post.places?.[0]?.photoUrl || "/default-image.png"}
            alt={post.title || "게시글 이미지"}
            onError={handleImageError}
            className="main-image"
            loading="lazy"
          />
          {post.places?.[1]?.photoUrl ? (
            <img
              src={post.places[1].photoUrl}
              alt={`${post.title || "게시글"} 서브 이미지`}
              className="sub-image"
              onError={handleImageError}
              loading="lazy"
            />
          ) : post.places?.length === 1 ? null : (
            <div className="sub-image-placeholder" />
          )}
        </div>
      </div>

      {/* 콘텐츠 섹션 */}
      <div className="post-content">
        <div className="profile-date-section">
          <img
            src={post.author?.profileImageUrl || "/default-profile.png"}
            alt={`${getAuthorName()} 프로필`}
            className="profile-img"
            onError={handleProfileImageError}
            onClick={handleProfileClick}
            loading="lazy"
            style={{ cursor: "pointer" }}
          />
          <p className="post-date">
            {getAuthorName()} • {formatDate(post.createdAt)}
          </p>
        </div>

        <h3 className="post-title" title={post.title || "제목 없음"}>
          {truncateTitle(post.title)}
        </h3>

        <div className="post-bottom">
          <div className="post-tags">
            {post.tags &&
              post.tags.length > 0 &&
              post.tags.slice(0, 2).map((tag, idx) => (
                <span
                  key={idx}
                  className="tag"
                  title={`#${tagMap[tag] || tag}`}
                >
                  #{tagMap[tag] || tag}
                </span>
              ))}
          </div>

          <div className="post-actions">
            <button
              className={`action-btn bookmark-btn ${
                bookmarked ? "active" : ""
              }`}
              onClick={toggleBookmark}
              aria-label={`북마크 ${bookmarked ? "해제" : "추가"}`}
              title={`북마크 ${bookmarked ? "해제" : "추가"}`}
            >
              <FaBookmark />
              <span>{formatCount(bookmarkCount)}</span>
            </button>

            <button
              className={`action-btn like-btn ${liked ? "active" : ""}`}
              onClick={toggleLike}
              aria-label={`좋아요 ${liked ? "해제" : "추가"}`}
              title={`좋아요 ${liked ? "해제" : "추가"}`}
            >
              <FaHeart />
              <span>{formatCount(likeCount)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
