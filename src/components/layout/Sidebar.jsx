import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaPen,
  FaCheckCircle,
  FaBookmark,
  FaUser,
  FaSignOutAlt,
} from "react-icons/fa";
import "./Sidebar.css";
import baseApi from "../../api/baseApi";

const Sidebar = ({ isLoggedIn, setIsLoggedIn, setIsLoginModalOpen }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: "/create", label: "작성", icon: <FaPen />, tooltip: "게시글 작성" },
    {
      path: "/certification",
      label: "인증",
      icon: <FaCheckCircle />,
      tooltip: "인증하기",
    },
    {
      path: "/scrapbook",
      label: "스크랩북",
      icon: <FaBookmark />,
      tooltip: "스크랩북",
    },
    { path: "/mypage", label: "MY", icon: <FaUser />, tooltip: "마이페이지" },
  ];

  // 닉네임 길이에 따른 클래스/속성 결정
  const getNicknameProps = (nickname) => {
    if (!nickname) return { className: "username", "data-length": "0" };

    const length = nickname.length;

    if (length > 10) {
      return {
        className: "username long-name",
        "data-length": "10+",
      };
    }

    return {
      className: "username",
      "data-length": length.toString(),
    };
  };

  // 유저 정보 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      const token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken");

      if (!isLoggedIn || !token) {
        setUser(null);
        return;
      }

      try {
        const res = await baseApi.get("/user/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(res.data.data || res.data); // API 응답 구조에 따라 조정
      } catch (err) {
        console.error("유저 정보 요청 실패:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setIsLoggedIn(false);
          localStorage.removeItem("accessToken");
          sessionStorage.removeItem("accessToken");
          setUser(null);
        } else {
          setUser(null);
        }
      }
    };

    fetchUser();
  }, [isLoggedIn, setIsLoggedIn]);

  // 🎯 프로필 업데이트 이벤트 리스너 추가
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      console.log("사이드바에서 프로필 업데이트 이벤트 수신:", event.detail);
      const { user: updatedUser, nickname, profileImageUrl } = event.detail;

      if (updatedUser) {
        setUser(updatedUser);
      } else {
        // 부분 업데이트
        setUser((prev) =>
          prev
            ? {
                ...prev,
                nickname: nickname || prev.nickname,
                profileImageUrl: profileImageUrl || prev.profileImageUrl,
              }
            : null
        );
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener("userProfileUpdated", handleProfileUpdate);

    // 클린업
    return () => {
      window.removeEventListener("userProfileUpdated", handleProfileUpdate);
    };
  }, []);

  const handleLogout = async () => {
    const leave = window.confirm("정말 로그아웃 하시겠습니까?");
    if (!leave) return;

    try {
      if (user?.email) {
        await baseApi.post(
          "/auth/logout",
          { email: user.email },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );
      }
    } catch (err) {
      console.error("로그아웃 실패:", err);
    } finally {
      localStorage.removeItem("accessToken");
      sessionStorage.removeItem("accessToken");
      setIsLoggedIn(false);
      setUser(null);
      navigate("/");
    }
  };

  const handleMenuClick = (path) => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    const leavePages = ["/create", "/edit"]; // 필요에 따라 수정 페이지 경로 추가
    if (leavePages.includes(location.pathname)) {
      const leave = window.confirm(
        "작성 중인 페이지를 벗어나면 저장되지 않은 내용이 사라집니다. 정말 나가시겠습니까?"
      );
      if (!leave) return;
    }

    navigate(path);
  };

  // 현재 사용자 닉네임 가져오기
  const currentNickname = user?.nickname || user?.name || "사용자";
  const nicknameProps = getNicknameProps(currentNickname);

  return (
    <div className="sidebar">
      <div className="sidebar-top">
        <div
          className="logo-box"
          onClick={() => navigate("/postlist")}
          style={{ cursor: "pointer" }}
        >
          <img src="/logo2.png" alt="logo2" className="logo-img" />
        </div>

        {isLoggedIn && user ? (
          <div className="profile-box">
            <img
              src={
                user?.profileImageUrl ||
                user?.profileImage ||
                user?.profile_image ||
                "./default_profile.png"
              }
              alt="프로필"
              className="sidebar-profile-img"
              onError={(e) => {
                e.target.src = "./default_profile.png";
              }}
              // 🎯 이미지 비율 유지를 위한 스타일 추가
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                objectFit: "cover", // 이미지 비율 유지하면서 원형으로 자르기
                objectPosition: "center",
              }}
            />
            <p {...nicknameProps}>{currentNickname}님</p>
          </div>
        ) : (
          <div className="profile-box">
            <img
              src="./default_profile.png"
              className="sidebar-profile-img"
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                objectFit: "cover",
                objectPosition: "center",
              }}
            />
            <p className="username login-required">
              로그인이
              <br />
              필요합니다
            </p>
          </div>
        )}

        <ul className="menu">
          {menuItems.map((item) => (
            <li
              key={item.path}
              className={`menu-item ${
                location.pathname === item.path ? "active" : ""
              }`}
              onClick={() => handleMenuClick(item.path)}
              data-tooltip={item.tooltip}
            >
              {item.icon}
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-bottom">
        {isLoggedIn ? (
          <div
            className="logout-btn"
            onClick={handleLogout}
            data-tooltip="로그아웃"
          >
            <FaSignOutAlt className="logout-icon" />
            <span>로그아웃</span>
          </div>
        ) : (
          <div
            className="logout-btn"
            onClick={() => setIsLoginModalOpen(true)}
            data-tooltip="로그인"
          >
            <FaUser className="logout-icon" />
            <span>로그인</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
