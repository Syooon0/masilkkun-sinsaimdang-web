import React, { useState } from "react";
import Sidebar from "./Sidebar";
import PostList from "../post/PostList";
import CertPage from "../../pages/CertificationPage";
import ScrapbookPage from "../../pages/ScrapbookPage";
import MyPage from "../../pages/MyPage";
import "./Layout.css";
import Region from "./Region";
import Mapview from "../main/Mapview";

const Layout = () => {
  const [activePage, setActivePage] = useState("작성");
  const [region, setRegion] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("여행지");
  const [sortOrder, setSortOrder] = useState("기본순");

  const renderContent = () => {
    switch (activePage) {
      case "작성":
        return (
          <div className="layout-post-list-page">
            <div className="list-top">
              <div className="top-bar">
                <Region
                  type="text"
                  className="search-input"
                  placeholder="지역을 선택해주세요."
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                />
              </div>

              <div className="filter-bar">
                <div className="category-btns">
                  {["여행지", "맛집", "카페"].map((cat) => (
                    <button
                      key={cat}
                      className={`category-btn ${
                        selectedCategory === cat ? "active" : ""
                      }`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <select
                  className="sort-select"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="기본순">기본순</option>
                  <option value="좋아요순">좋아요순</option>
                </select>
              </div>
            </div>
            <PostList
              region={region}
              category={selectedCategory}
              sortOrder={sortOrder}
            />
          </div>
        );
      case "인증":
        return <CertPage />;
      case "스크랩북":
        return <ScrapbookPage />;
      case "MY":
        return <MyPage />;
      default:
        return <div>페이지를 찾을 수 없습니다.</div>;
    }
  };

  return (
    <div className="layout-container">
      <div className="left-section">
        <div className="sidebar-wrapper">
          <Sidebar setActivePage={setActivePage} />
        </div>
        <div className="content-wrapper">{renderContent()}</div>
      </div>
      <div className="right-section"></div>
    </div>
  );
};

export default Layout;
