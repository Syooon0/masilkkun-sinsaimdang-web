// src/pages/Register.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import baseApi from "../api/baseApi";
import "./Register.css";
import RegisterComplete from "../assets/RegisterComplete.png";

const Register = ({ onSwitch, onRegisterSuccess }) => {
  const navigate = useNavigate();

  // 입력값 상태
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [completed, setCompleted] = useState(false); // ✅ 완료 상태
  // 중복확인 여부
  const [emailChecked, setEmailChecked] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);

  // 메시지 상태 분리
  const [emailMessage, setEmailMessage] = useState("");
  const [nicknameMessage, setNicknameMessage] = useState("");
  const [formError, setFormError] = useState("");

  // 회원가입 완료 모달 상태
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // ================= 이메일/닉네임 중복 확인 =================
  const checkEmailDuplication = async () => {
    setEmailMessage("");
    setFormError("");
    if (!email.includes("@")) {
      setEmailMessage("올바른 이메일 형식을 입력해주세요.");
      return;
    }
    try {
      const res = await baseApi.get("/auth/check-email", { params: { email } });
      const isAvailable = res.data.data.available;
      setEmailMessage(
        isAvailable
          ? "사용 가능한 이메일입니다."
          : "이미 사용 중인 이메일입니다."
      );
      setEmailChecked(isAvailable);
    } catch (error) {
      console.error("이메일 중복 확인 오류:", error);
      setEmailMessage("이메일 중복 확인 중 오류가 발생했습니다.");
    }
  };

  const checkNicknameDuplication = async () => {
    setNicknameMessage("");
    setFormError("");
    if (nickname.length < 2 || nickname.length > 12) {
      setNicknameMessage("닉네임은 2자 이상 12자 이하로 입력해주세요.");
      return;
    }
    try {
      const res = await baseApi.get("/auth/check-nickname", {
        params: { nickname },
      });
      const isAvailable = res.data.data.available;
      setNicknameMessage(
        isAvailable
          ? "사용 가능한 닉네임입니다."
          : "이미 사용 중인 닉네임입니다."
      );
      setNicknameChecked(isAvailable);
    } catch (error) {
      console.error("닉네임 중복 확인 오류:", error);
      setNicknameMessage("닉네임 중복 확인 중 오류가 발생했습니다.");
    }
  };

  // ================= 회원가입 제출 =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!email.includes("@"))
      return setFormError("올바른 이메일 주소를 입력해주세요.");
    if (!emailChecked) return setFormError("이메일 중복 확인을 먼저 해주세요.");
    if (password.length < 4 || password.length > 16)
      return setFormError("비밀번호는 4~16자여야 합니다.");
    const pwRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[\W_]).{4,16}$/;
    if (!pwRegex.test(password))
      return setFormError("비밀번호는 영어/숫자/특수문자를 포함해야 합니다.");
    if (password !== confirmPassword)
      return setFormError("비밀번호가 일치하지 않습니다.");
    if (name.trim().length === 0) return setFormError("이름을 입력해주세요.");
    if (nickname.length < 2 || nickname.length > 12)
      return setFormError("닉네임은 2자 이상 12자 이하로 입력해주세요.");
    if (!nicknameChecked)
      return setFormError("닉네임 중복 확인을 먼저 해주세요.");

    try {
      const response = await baseApi.post("/auth/signup", {
        email,
        password,
        name,
        nickname,
      });
      if (response.status === 201 || response.status === 200) {
        setCompleted(true); // ✅ 완료 상태로 전환
      }
    } catch (error) {
      console.error("회원가입 실패:", error);
      if (error.response?.data?.message)
        setFormError(error.response.data.message);
      else setFormError("회원가입에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleModalClose = () => {
    setShowCompleteModal(false);
    navigate("/login"); // 모달 확인 후 로그인 페이지로 이동
  };

  if (completed) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center", // 수직 가운데 정렬
          justifyContent: "center", // 수평 가운데 정렬
          height: "100vh", // 화면 전체 높이
          backgroundColor: "#fff", // 모달 배경 느낌
        }}
      >
        <div
          className="register-complete"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "30px",
            borderRadius: "12px",
            backgroundColor: "#fff",
            textAlign: "center",
            gap: "15px",
            width: "100%",
            maxWidth: "400px",
          }}
        >
          <img src={RegisterComplete} className="logo" />
          <h3 style={{ fontSize: "1.8rem", color: "#9a7937", margin: 0 }}>
            🎉 회원가입 완료! 🎉
          </h3>
          <p style={{ fontSize: "1rem", color: "#9a7937", margin: 0 }}>
            이제 로그인하여 서비스를 이용할 수 있습니다.
          </p>
          <button
            onClick={onRegisterSuccess}
            style={{
              marginTop: "20px",
              padding: "10px 25px",
              fontSize: "1rem",
              fontWeight: "600",
              color: "#fff",
              backgroundColor: "#9a7937",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={
              (e) => (e.currentTarget.style.backgroundColor = "#80603a") // hover 시 톤 다운
            }
            onMouseLeave={
              (e) => (e.currentTarget.style.backgroundColor = "#9a7937") // 기본색 복원
            }
          >
            로그인 화면으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <h2 className="register-title">회원가입</h2>
      <form onSubmit={handleSubmit} className="register-form">
        {/* 이메일 */}
        <div className="form-group">
          <label className="register-label">이메일</label>
          <div className="input-with-button">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailChecked(false);
                setEmailMessage("");
                setFormError("");
              }}
              className="register-input"
              placeholder="이메일을 입력해주세요."
            />
            <button
              type="button"
              onClick={checkEmailDuplication}
              className="dup-check-button"
            >
              중복 확인
            </button>
          </div>
          <p
            className={`message ${
              emailMessage.includes("가능") ? "valid" : "invalid"
            }`}
          >
            {emailMessage}
          </p>
        </div>

        {/* 비밀번호 */}
        <div className="form-group">
          <label className="register-label">비밀번호</label>
          <input
            type="password"
            placeholder="비밀번호는 8~20자 이하, 대소문자, 숫자, 특수문자 포함"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="register-input"
          />
          <div className="message"></div>
        </div>

        {/* 비밀번호 확인 */}
        <div className="form-group">
          <label className="register-label">비밀번호 확인</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="register-input"
            placeholder="비밀번호를 다시 입력해주세요."
          />
          <div className="message"></div>
        </div>

        {/* 이름 */}
        <div className="form-group">
          <label className="register-label">이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="register-input"
            placeholder="이름을 입력해주세요."
          />
          <div className="message"></div>
        </div>

        {/* 닉네임 */}
        <div className="form-group">
          <label className="register-label">닉네임</label>
          <div className="input-with-button">
            <input
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setNicknameChecked(false);
                setNicknameMessage("");
                setFormError("");
              }}
              className="register-input"
              placeholder="2자 이상 12자 이하"
            />
            <button
              type="button"
              onClick={checkNicknameDuplication}
              className="dup-check-button"
            >
              중복 확인
            </button>
          </div>
          <p
            className={`message ${
              nicknameMessage.includes("가능") ? "valid" : "invalid"
            }`}
          >
            {nicknameMessage}
          </p>
        </div>

        <p className="error-message">{formError}</p>

        <button type="submit" className="register-button">
          회원가입
        </button>
        <span role="button" className="back-to-login" onClick={onSwitch}>
          로그인으로 돌아가기
        </span>
      </form>
    </div>
  );
};

export default Register;
