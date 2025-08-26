import React, { useState, useEffect } from "react";
import PostList from "../components/post/PostList";
import "./PostListPage.css";
import Region from "../components/layout/Region";
import baseApi from "../api/baseApi";
import CategoryFilter from "../components/post/CategoryFilter";

const PostListPage = ({ sortOrder, setSortOrder }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]); // 선택된 태그 상태
  const [region, setRegion] = useState("");
  const regionMap = {
    서울: "서울특별시",
    부산: "부산광역시",
    대구: "대구광역시",
    인천: "인천광역시",
    광주: "광주광역시",
    대전: "대전광역시",
    울산: "울산광역시",
    세종: "세종특별자치시",
    경기: "경기도",
    강원: "강원특별자치도",
    충북: "충청북도",
    충남: "충청남도",
    전북: "전북특별자치도",
    전남: "전라남도",
    경북: "경상북도",
    경남: "경상남도",
    제주: "제주특별자치도",
  };
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = {
        page: 0,
        size: 10,
      };

      // 선택된 지역이 있으면 추가
      if (region) {
        params.region = regionMap[region]; // 선택한 지역을 서버에 보낼 형식으로 변환
      }

      // 선택된 태그가 있으면 쉼표로 연결
      if (selectedTags.length > 0) {
        params.tags = selectedTags.map((t) => t.value).join(","); // AND 조건
      }

      const response = await baseApi.get("/articles", { params });

      const content = response.data?.data?.content || []; // 여기서 content 가져오기
      setPosts(content);
    } catch (error) {
      console.error("게시글 불러오기 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedTags, region]);

  return (
    <div className="post-list-page">
      <div className="list-top">
        <div className="top-bar">
          <Region region={region} setRegion={setRegion} />
        </div>
        <div>
          <div className="filter-bar">
            <CategoryFilter
              selectedCategories={selectedTags}
              onCategoryChange={setSelectedTags}
            />

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
      </div>
      {loading ? (
        <div className="loading-container">
          <p>게시글을 불러오는 중...</p>
        </div>
      ) : (
        <PostList posts={posts} />
      )}
    </div>
  );
};

export default PostListPage;
