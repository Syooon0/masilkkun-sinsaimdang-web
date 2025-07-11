import logo from "../../assets/img/Logo.png";
import "./LoginForm.css";

const LoginForm = () => {
  return (
    <div className="loginform">
      <img src={logo} className="logo" />
      <div className="formbody">
        <div className="inputs">
          <input placeholder="아이디" />
          <input placeholder="비밀번호" />
        </div>
        <button className="button">로그인</button>
      </div>
    </div>
  );
};

export default LoginForm;
