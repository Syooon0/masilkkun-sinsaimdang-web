// src/pages/PostEditPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./PostCreatePage.css";
import baseApi from "../api/baseApi";

// ===== 미리보기용 절대경로 보정 =====
const API_BASE = (
  import.meta.env.VITE_FILE_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  ""
).replace(/\/$/, "");
const normalizeImageUrl = (u) => {
  if (!u) return null;
  const s = String(u);
  if (/^(blob:|data:|https?:\/\/)/i.test(s)) return s;
  return `${API_BASE}/${s.replace(/^\/+/, "")}`;
};
// blob/data URL 판단
const isBlobOrData = (u) => typeof u === "string" && /^(blob:|data:)/i.test(u);

const PostEditPage = ({ mapRef }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState([]);
  const [region, setRegion] = useState("");
  const [places, setPlaces] = useState([
    {
      placeName: "",
      address: null,
      roadAddress: null,
      previewUrl: null, // 미리보기용 URL
      uploadFile: null, // 새로 선택한 파일
      serverPhotoUrl: null, // 서버가 내려준 기존 URL(그대로 유지 보낼 값)
      description: "",
    },
  ]);
  const [loading, setLoading] = useState(true);

  const tagOptions = [
    { label: "여행지", value: "TRAVEL_SPOT" },
    { label: "맛집", value: "RESTAURANT" },
    { label: "카페", value: "CAFE" },
  ];

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

  // ====== 게시글 로드 ======
  useEffect(() => {
    const loadPostData = async () => {
      try {
        setLoading(true);
        const [userResponse, postResponse] = await Promise.all([
          baseApi.get("/user/me"),
          baseApi.get(`/articles/${id}`),
        ]);

        const userData = userResponse.data?.data || userResponse.data;
        const postData = postResponse.data?.data || postResponse.data;

        // 작성자 확인
        const isAuthor =
          userData &&
          postData &&
          (userData.id === postData.authorId ||
            userData.id === postData.author?.id ||
            userData.id === postData.userId);
        if (!isAuthor) {
          alert("본인이 작성한 게시글만 수정할 수 있습니다.");
          navigate(`/post/${id}`);
          return;
        }

        setTitle(postData.title || "");
        setRegion(postData.region || "");

        // 태그 세팅
        const formattedTags = (postData.tags || []).map((tag) => {
          const tagObj = tagOptions.find((t) => t.value === tag);
          return tagObj || { label: tag, value: tag };
        });
        setTags(formattedTags);

        // 장소 + 이미지 (백엔드 스키마: places[*].photoUrl)
        const formattedPlaces = (postData.places || []).map((p) => {
          const raw = p.photoUrl || null; // 유지 시 그대로 보낼 값
          const preview = raw ? normalizeImageUrl(raw) : null;
          return {
            placeName: p.placeName || "",
            address: p.address || p.roadAddress?.address_name || null,
            roadAddress: p.roadAddress || null,
            previewUrl: preview,
            uploadFile: null,
            serverPhotoUrl: raw,
            description: p.description || "",
          };
        });

        // region 비어있으면 추론
        if (!postData.region && formattedPlaces.length) {
          const first = formattedPlaces[0];
          const parts = (first.address || "").split(" ");
          if (first.roadAddress?.region_2depth_name) {
            setRegion(first.roadAddress.region_2depth_name);
          } else if (parts[1]) {
            setRegion(parts[1]);
          }
        }

        if (formattedPlaces.length === 0) {
          formattedPlaces.push({
            placeName: "",
            address: null,
            roadAddress: null,
            previewUrl: null,
            uploadFile: null,
            serverPhotoUrl: null,
            description: "",
          });
        }
        setPlaces(formattedPlaces);
      } catch (error) {
        if (error.response?.status === 401) {
          alert("로그인이 필요합니다.");
          navigate("/login");
          return;
        }
        console.error("게시글 로드 실패:", error);
        if (error.response?.status === 404) alert("게시글을 찾을 수 없습니다.");
        else if (error.response?.status === 403) alert("권한이 없습니다.");
        else alert("게시글을 불러오는데 실패했습니다.");
        navigate(`/post/${id}`);
      } finally {
        setLoading(false);
      }
    };

    if (id) loadPostData();
  }, [id, navigate]);

  // ====== 입력 처리 ======
  const toggleTag = (tag) => {
    setTags((prev) =>
      prev.some((t) => t.value === tag.value)
        ? prev.filter((t) => t.value !== tag.value)
        : [...prev, tag]
    );
  };

  const handleImageUpload = (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB 이하만 가능합니다.");
      return;
    }
    const updated = [...places];
    updated[index].previewUrl = URL.createObjectURL(file); // 미리보기
    updated[index].uploadFile = file; // 새 파일
    setPlaces(updated);
  };

  const handlePlaceNameChange = (index, value) => {
    const updated = [...places];
    updated[index].placeName = value;
    setPlaces(updated);
  };
  const handleDescriptionChange = (index, value) => {
    const updated = [...places];
    updated[index].description = value;
    setPlaces(updated);
  };

  const handleAddPlace = () =>
    setPlaces((prev) => [
      ...prev,
      {
        placeName: "",
        address: null,
        roadAddress: null,
        previewUrl: null,
        uploadFile: null,
        serverPhotoUrl: null,
        description: "",
      },
    ]);

  const handleRemovePlace = (index) =>
    places.length > 1 && setPlaces(places.filter((_, i) => i !== index));

  const pickRegionFrom = (roadAddress, addressStr) => {
    try {
      if (roadAddress?.region_2depth_name)
        return roadAddress.region_2depth_name;
      if (typeof addressStr === "string" && addressStr.trim()) {
        const parts = addressStr.trim().split(/\s+/);
        if (parts[1]) return parts[1];
      }
    } catch {}
    return "";
  };

  const validateForm = () => {
    if (!title.trim()) return alert("제목을 입력해주세요."), false;
    if (tags.length === 0)
      return alert("최소 하나의 태그를 선택해주세요."), false;
    if (places.some((p) => !p.placeName.trim()))
      return alert("모든 장소의 이름을 입력해주세요."), false;

    const finalRegion =
      region ||
      pickRegionFrom(places[0]?.roadAddress, places[0]?.address) ||
      "";
    if (!finalRegion) return alert("지역을 확인해주세요."), false;

    return true;
  };

  // ====== 저장 (백엔드 규칙 적용) ======
  const handleSubmit = async () => {
    if (!validateForm()) return;

    const finalRegion =
      region ||
      pickRegionFrom(places[0]?.roadAddress, places[0]?.address) ||
      "";

    // 1) JSON 본문: 유지=URL / 교체=null
    const placesPayload = places.map((p, i) => {
      const hasNew = !!p.uploadFile;
      // 기존 URL(서버가 준 것)만 유지값으로 보냄. blob/data는 제외.
      const keepUrl =
        p.serverPhotoUrl ||
        (typeof p.previewUrl === "string" && !isBlobOrData(p.previewUrl)
          ? p.previewUrl
          : null);

      return {
        placeOrder: i + 1,
        placeName: p.placeName,
        description: p.description,
        address: p.address || p.roadAddress?.address_name || "",
        roadAddress: p.roadAddress || {
          address_name: "",
          region_1depth_name: "",
          region_2depth_name: "",
        },
        photoUrl: hasNew ? null : keepUrl || null, // ★ 핵심 규칙
      };
    });

    const requestJson = {
      title,
      content: places.map((p) => p.description).join("\n\n"),
      region: finalRegion, // 스펙에 필수는 아니지만 포함
      tags: tags.map((t) => t.value || t),
      places: placesPayload,
    };

    // 2) 새 파일 수집 (photoUrl=null인 순서와 정확히 일치해야 함)
    const nullTargets = placesPayload
      .map((pl, idx) => ({ idx, isNull: pl.photoUrl === null }))
      .filter((x) => x.isNull)
      .map((x) => x.idx);

    const newFilesInOrder = [];
    for (const idx of nullTargets) {
      const file = places[idx].uploadFile;
      if (!file) {
        alert(
          `사진을 교체/추가하도록 표시(place ${
            idx + 1
          })했지만 파일이 없습니다.\n새 파일을 첨부하거나, 해당 장소의 사진을 유지하려면 업로드를 취소하세요.`
        );
        return;
      }
      newFilesInOrder.push(file);
    }

    // 3) 멀티파트 구성: request(JSON) + newImages(순서대로)
    const fd = new FormData();
    fd.append(
      "request",
      new Blob([JSON.stringify(requestJson)], { type: "application/json" })
    );
    newFilesInOrder.forEach((file) => {
      fd.append("newImages", file, file.name || "image.jpg");
    });

    // 디버깅 원하면 주석 해제
    // for (const [k, v] of fd.entries()) {
    //   console.log("FD", k, v && v.name ? v.name : v);
    // }

    try {
      await baseApi.put(`/articles/${id}`, fd, {
        transformRequest: [(d) => d], // FormData 그대로 전송
      });
      alert("게시글이 성공적으로 수정되었습니다!");
      navigate(`/post/${id}`);
    } catch (err) {
      console.error("게시글 수정 실패:", err?.response?.data || err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "게시글 수정에 실패했습니다. 다시 시도해주세요.";
      if (err?.response?.status === 401) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }
      alert(msg);
    }
  };

  // ====== 지도에서 장소 선택 ======
  const handleLocationClick = (index) => {
    if (!mapRef?.current) return;
    mapRef.current.openSearch();
    mapRef.current.setOnSelectPlace((place) => {
      try {
        if (!place.placeName || !place.address)
          throw new Error("선택한 장소에 주소 정보가 없습니다.");
        const [region1, region2] = place.address.split(" ");
        const updated = [...places];
        updated[index] = {
          ...updated[index],
          placeName: place.placeName,
          address: place.address,
          roadAddress: {
            address_name: place.address,
            region_1depth_name: regionMap[region1] || region1,
            region_2depth_name: region2 || "",
          },
        };
        setPlaces(updated);

        const nextRegion = pickRegionFrom(
          updated[index].roadAddress,
          updated[index].address
        );
        if (nextRegion) setRegion(nextRegion);
      } catch (err) {
        console.error("주소 처리 실패:", err);
        alert(err.message);
      }
    });
  };

  if (loading) {
    return (
      <div className="post-create-container">
        <div className="loading-message">게시글을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="post-create-container">
      <div className="page-header">
        <h3 style={{ textAlign: "center" }}>게시글 수정</h3>
      </div>

      <div className="post-create-content">
        <input
          type="text"
          placeholder="제목을 입력해주세요."
          className="post-create-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
        />

        {/* region은 UI 비노출 */}
        <div style={{ display: "none" }}>
          <input value={region} onChange={(e) => setRegion(e.target.value)} />
        </div>

        <div className="tag-select-container">
          {tagOptions.map((tag) => (
            <button
              key={tag.value}
              className={`tag-select-chip ${
                tags.some((t) => t.value === tag.value) ? "selected" : ""
              }`}
              onClick={() => toggleTag(tag)}
              type="button"
            >
              {tag.label}
            </button>
          ))}
        </div>

        {places.map((place, index) => (
          <div className="place-section" key={index}>
            <div className="place-header">
              <div className="place-number">{index + 1}</div>
              <span className="place-title">장소 정보를 입력해주세요.</span>
              {places.length > 1 && (
                <button
                  className="place-remove-btn"
                  onClick={() => handleRemovePlace(index)}
                  type="button"
                >
                  ×
                </button>
              )}
            </div>

            <div
              className="place-name-input"
              maxLength={50}
              placeholder="장소 이름"
              value={place.placeName}
              onChange={(e) => handlePlaceNameChange(index, e.target.value)}
            >
              장소 : {place.placeName}
            </div>

            <button
              className="location-select-btn"
              type="button"
              onClick={() => handleLocationClick(index)}
            >
              위치 등록
            </button>

            {place.address && (
              <div className="selected-address">주소: {place.address}</div>
            )}

            {/* 이미지 업로드/미리보기 */}
            <div className="image-upload-section">
              <label
                htmlFor={`imageUpload-${index}`}
                className="image-upload-label"
              >
                <div className="image-upload-placeholder">
                  {place.previewUrl ? (
                    <img
                      src={place.previewUrl}
                      alt="미리보기"
                      className="uploaded-image"
                      onError={() =>
                        console.warn("이미지 로드 실패:", place.previewUrl)
                      }
                    />
                  ) : (
                    <>
                      <div className="image-icon">📷</div>
                      <span>사진을 업로드해주세요.</span>
                    </>
                  )}
                </div>
              </label>
              <input
                id={`imageUpload-${index}`}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(index, e)}
                style={{ display: "none" }}
              />
            </div>

            <textarea
              className="place-description-input"
              placeholder="설명을 작성해주세요."
              value={place.description}
              onChange={(e) => handleDescriptionChange(index, e.target.value)}
              maxLength={500}
              rows={4}
            />
          </div>
        ))}

        <button
          className="add-place-btn"
          onClick={handleAddPlace}
          type="button"
        >
          + 장소 추가
        </button>
      </div>

      <div className="post-create-footer">
        <button
          className="temp-save-btn"
          onClick={() => navigate(`/post/${id}`)}
          type="button"
        >
          취소
        </button>
        <button className="submit-btn" onClick={handleSubmit} type="button">
          수정완료
        </button>
      </div>
    </div>
  );
};

export default PostEditPage;
