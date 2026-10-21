"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import type { SiteConfig, BannerItemConfig } from "@/lib/db";
import { fileToDataUrl } from "@/lib/imageUpload";

export default function BannersClient({
  initialConfig,
  items,
}: {
  initialConfig: SiteConfig;
  items: Array<{ it_id: string; it_name: string }>;
}) {
  const router = useRouter();
  const [config, setConfig] = useState<SiteConfig>(initialConfig);
  const [saving, setSaving] = useState(false);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onLoaded: (dataUrl: string) => void,
    maxWidth = 1400
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file, maxWidth);
      onLoaded(dataUrl);
    } catch (err: any) {
      alert(err?.message || "이미지 업로드 실패");
    } finally {
      e.target.value = "";
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.ok) {
        alert("로고, 배너 및 사이트 설정이 저장되었습니다.");
        router.refresh();
      } else {
        alert(data.message || "저장 실패");
      }
    } catch {
      alert("서버 통신 오류");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = async () => {
    if (
      !confirm(
        "로고, 상·하단 배너 및 푸터 설정을 초기 기본값으로 되돌리시겠습니까?"
      )
    )
      return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });
      const data = await res.json();
      if (data.ok && data.config) {
        setConfig(data.config);
        alert("초기 설정으로 복원되었습니다.");
        router.refresh();
      }
    } catch {
      alert("서버 통신 오류");
    } finally {
      setSaving(false);
    }
  };

  const handleAddExtraBanner = (position: "top" | "bottom") => {
    const newBanner: BannerItemConfig = {
      id: `bn_${Date.now()}`,
      position,
      title: position === "top" ? "추가 상단 배너" : "추가 하단 배너",
      image_url:
        position === "top" ? "/data/banner/1.png" : "/data/banner/2.png",
      bg_color: position === "top" ? "#FFCFDE" : "#D5E1EF",
      link_url: "/shop/item/1698900476",
      open_new_tab: false,
      is_visible: true,
    };
    setConfig((prev) => ({
      ...prev,
      extra_banners: [...(prev.extra_banners || []), newBanner],
    }));
  };

  return (
    <AdminLayout
      title="배너 · 로고 · 사이트 디자인 관리"
      subtitle="메인 화면 상·하단 배너 이미지, 배경색상, 이동 링크, 헤더 로고 및 푸터 기관 정보를 직접 업로드·수정합니다."
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefault}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
          >
            기본값 복원
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition"
          >
            {saving ? "저장 중..." : "✓ 전체 설정 저장하기"}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-8">
        {/* 1. 사이트 상단 로고 관리 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-5">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold mb-1">
                HEADER LOGO
              </span>
              <h2 className="text-lg font-extrabold text-slate-900">
                1. 사이트 상단 로고 (Header Logo) 등록 및 변경
              </h2>
            </div>
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition">
              <span>📁 내 PC에서 로고 이미지 업로드</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleFileUpload(
                    e,
                    (dataUrl) =>
                      setConfig((prev) => ({ ...prev, logo_url: dataUrl })),
                    600
                  )
                }
              />
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 border border-slate-200 min-h-[140px]">
              <span className="text-[11px] font-bold text-slate-400 mb-3">
                실제 헤더 로고 미리보기
              </span>
              <div className="bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center">
                <img
                  src={config.logo_url || "/data/common/mobile_logo_img.png"}
                  alt="사이트 로고 미리보기"
                  style={{ width: `${config.logo_width || 152}px` }}
                  className="h-auto object-contain max-h-20"
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-600 mb-1">
                    사이트명 (브라우저 타이틀 / 대체 텍스트)
                  </label>
                  <input
                    type="text"
                    value={config.site_title || ""}
                    onChange={(e) =>
                      setConfig({ ...config, site_title: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    로고 가로 크기 (px)
                  </label>
                  <input
                    type="number"
                    min={60}
                    max={400}
                    value={config.logo_width || 152}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        logo_width: Number(e.target.value) || 152,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  로고 이미지 경로 또는 URL (파일 업로드 시 자동 입력됨)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={
                      config.logo_url?.startsWith("data:")
                        ? "[직접 업로드된 로고 이미지 데이터]"
                        : config.logo_url || ""
                    }
                    onChange={(e) =>
                      setConfig({ ...config, logo_url: e.target.value })
                    }
                    placeholder="/data/common/mobile_logo_img.png"
                    className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setConfig({
                        ...config,
                        logo_url: "/data/common/mobile_logo_img.png",
                        logo_width: 152,
                      })
                    }
                    className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 font-bold shrink-0"
                  >
                    기본 로고로
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. 메인 상단 배너 관리 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-700 text-[11px] font-bold mb-1">
                  MAIN TOP BANNER
                </span>
                <h2 className="text-lg font-extrabold text-slate-900">
                  2. 메인 상단 배너 등록 및 설정
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.top_banner.is_visible}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      top_banner: {
                        ...config.top_banner,
                        is_visible: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 accent-indigo-600"
                />
                <span>상단 배너 노출하기</span>
              </label>

              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition">
                <span>📁 상단 배너 이미지 업로드</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleFileUpload(e, (dataUrl) =>
                      setConfig((prev) => ({
                        ...prev,
                        top_banner: { ...prev.top_banner, image_url: dataUrl },
                      }))
                    )
                  }
                />
              </label>
            </div>
          </div>

          {/* 상단 배너 실시간 미리보기 */}
          <div className="mb-5">
            <div className="text-[11px] font-bold text-slate-400 mb-1.5">
              상단 배너 실시간 미리보기 (배경색: {config.top_banner.bg_color})
            </div>
            <div
              className="w-full rounded-2xl overflow-hidden border border-slate-200 flex justify-center p-2"
              style={{ backgroundColor: config.top_banner.bg_color || "#FFCFDE" }}
            >
              <img
                src={config.top_banner.image_url || "/data/banner/1.png"}
                alt={config.top_banner.alt_text}
                className="max-h-56 w-auto object-contain mx-auto"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-600 mb-1">
                배너 좌우 여백 배경색상 (HEX)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.top_banner.bg_color || "#FFCFDE"}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      top_banner: {
                        ...config.top_banner,
                        bg_color: e.target.value,
                      },
                    })
                  }
                  className="w-10 h-9 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                />
                <input
                  type="text"
                  value={config.top_banner.bg_color || "#FFCFDE"}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      top_banner: {
                        ...config.top_banner,
                        bg_color: e.target.value,
                      },
                    })
                  }
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">
                클릭 시 이동할 검사 상품 빠른 선택
              </label>
              <select
                value={
                  config.top_banner.link_url.startsWith("/shop/item/")
                    ? config.top_banner.link_url.replace("/shop/item/", "")
                    : ""
                }
                onChange={(e) => {
                  if (e.target.value) {
                    setConfig({
                      ...config,
                      top_banner: {
                        ...config.top_banner,
                        link_url: `/shop/item/${e.target.value}`,
                      },
                    });
                  }
                }}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold text-slate-800"
              >
                <option value="">-- 직접 링크 입력 또는 검사 선택 --</option>
                {items.map((it) => (
                  <option key={it.it_id} value={it.it_id}>
                    {it.it_name} (/shop/item/{it.it_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">
                클릭 시 이동할 링크 URL
              </label>
              <input
                type="text"
                value={config.top_banner.link_url || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    top_banner: {
                      ...config.top_banner,
                      link_url: e.target.value,
                    },
                  })
                }
                placeholder="/shop/item/1698900476"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-4">
            <div>
              <label className="block font-bold text-slate-600 mb-1">
                배너 설명 (대체 텍스트)
              </label>
              <input
                type="text"
                value={config.top_banner.alt_text || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    top_banner: {
                      ...config.top_banner,
                      alt_text: e.target.value,
                    },
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">
                이미지 경로/데이터
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={
                    config.top_banner.image_url?.startsWith("data:")
                      ? "[직접 업로드된 상단 배너 이미지]"
                      : config.top_banner.image_url || ""
                  }
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      top_banner: {
                        ...config.top_banner,
                        image_url: e.target.value,
                      },
                    })
                  }
                  className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 font-mono"
                />
                <button
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      top_banner: {
                        ...config.top_banner,
                        image_url: "/data/banner/1.png",
                        bg_color: "#FFCFDE",
                      },
                    })
                  }
                  className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 font-bold"
                >
                  기본 이미지로
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 메인 하단 배너 관리 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-5">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold mb-1">
                MAIN BOTTOM BANNER
              </span>
              <h2 className="text-lg font-extrabold text-slate-900">
                3. 메인 하단 배너 등록 및 설정 (검사문의 · 단체문의 배너)
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.bottom_banner.is_visible}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      bottom_banner: {
                        ...config.bottom_banner,
                        is_visible: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 accent-indigo-600"
                />
                <span>하단 배너 노출하기</span>
              </label>

              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition">
                <span>📁 하단 배너 이미지 업로드</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleFileUpload(e, (dataUrl) =>
                      setConfig((prev) => ({
                        ...prev,
                        bottom_banner: {
                          ...prev.bottom_banner,
                          image_url: dataUrl,
                        },
                      }))
                    )
                  }
                />
              </label>
            </div>
          </div>

          {/* 하단 배너 실시간 미리보기 */}
          <div className="mb-5">
            <div className="text-[11px] font-bold text-slate-400 mb-1.5">
              하단 배너 실시간 미리보기 (배경색: {config.bottom_banner.bg_color})
            </div>
            <div
              className="w-full rounded-2xl overflow-hidden border border-slate-200 flex justify-center p-2"
              style={{
                backgroundColor: config.bottom_banner.bg_color || "#D5E1EF",
              }}
            >
              <img
                src={config.bottom_banner.image_url || "/data/banner/2.png"}
                alt={config.bottom_banner.alt_text}
                className="max-h-44 w-auto object-contain mx-auto"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-600 mb-1">
                배너 좌우 여백 배경색상 (HEX)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.bottom_banner.bg_color || "#D5E1EF"}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      bottom_banner: {
                        ...config.bottom_banner,
                        bg_color: e.target.value,
                      },
                    })
                  }
                  className="w-10 h-9 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                />
                <input
                  type="text"
                  value={config.bottom_banner.bg_color || "#D5E1EF"}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      bottom_banner: {
                        ...config.bottom_banner,
                        bg_color: e.target.value,
                      },
                    })
                  }
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">
                클릭 시 이동할 링크 URL (카카오톡 상담 채널 등)
              </label>
              <input
                type="text"
                value={config.bottom_banner.link_url || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    bottom_banner: {
                      ...config.bottom_banner,
                      link_url: e.target.value,
                    },
                  })
                }
                placeholder="https://pf.kakao.com/_HxhcYxj/chat"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">
                링크 열기 방식
              </label>
              <select
                value={config.bottom_banner.open_new_tab ? "new" : "self"}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    bottom_banner: {
                      ...config.bottom_banner,
                      open_new_tab: e.target.value === "new",
                    },
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
              >
                <option value="new">새 창으로 열기 (_blank)</option>
                <option value="self">현재 창에서 이동</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-4">
            <div>
              <label className="block font-bold text-slate-600 mb-1">
                배너 설명 (대체 텍스트)
              </label>
              <input
                type="text"
                value={config.bottom_banner.alt_text || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    bottom_banner: {
                      ...config.bottom_banner,
                      alt_text: e.target.value,
                    },
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">
                이미지 경로/데이터
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={
                    config.bottom_banner.image_url?.startsWith("data:")
                      ? "[직접 업로드된 하단 배너 이미지]"
                      : config.bottom_banner.image_url || ""
                  }
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      bottom_banner: {
                        ...config.bottom_banner,
                        image_url: e.target.value,
                      },
                    })
                  }
                  className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 font-mono"
                />
                <button
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      bottom_banner: {
                        ...config.bottom_banner,
                        image_url: "/data/banner/2.png",
                        bg_color: "#D5E1EF",
                      },
                    })
                  }
                  className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 font-bold"
                >
                  기본 이미지로
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. 추가 배너 슬롯 관리 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                4. 추가 배너 관리 (상단 / 하단 추가 배너 등록)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                기본 상·하단 배너 외에 추가로 노출할 이벤트/안내 배너가 있을 때 자유롭게 추가할 수 있습니다.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleAddExtraBanner("top")}
                className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold transition"
              >
                + 상단 추가배너 등록
              </button>
              <button
                type="button"
                onClick={() => handleAddExtraBanner("bottom")}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-extrabold transition"
              >
                + 하단 추가배너 등록
              </button>
            </div>
          </div>

          {(!config.extra_banners || config.extra_banners.length === 0) ? (
            <p className="text-xs text-slate-400 text-center py-6">
              등록된 추가 배너가 없습니다. 우측 상단 버튼으로 배너를 추가할 수 있습니다.
            </p>
          ) : (
            <div className="space-y-4">
              {config.extra_banners.map((bn, idx) => (
                <div
                  key={bn.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-bold">
                        {bn.position === "top" ? "상단 추가배너" : "하단 추가배너"}
                      </span>
                      <input
                        type="text"
                        value={bn.title}
                        onChange={(e) => {
                          const next = [...(config.extra_banners || [])];
                          next[idx] = { ...bn, title: e.target.value };
                          setConfig({ ...config, extra_banners: next });
                        }}
                        className="rounded-lg border border-slate-300 px-2.5 py-1 font-bold bg-white"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-1.5 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bn.is_visible}
                          onChange={(e) => {
                            const next = [...(config.extra_banners || [])];
                            next[idx] = { ...bn, is_visible: e.target.checked };
                            setConfig({ ...config, extra_banners: next });
                          }}
                        />
                        <span>노출</span>
                      </label>
                      <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold">
                        <span>이미지 업로드</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleFileUpload(e, (dataUrl) => {
                              const next = [...(config.extra_banners || [])];
                              next[idx] = { ...bn, image_url: dataUrl };
                              setConfig({ ...config, extra_banners: next });
                            })
                          }
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const next = (config.extra_banners || []).filter(
                            (_, i) => i !== idx
                          );
                          setConfig({ ...config, extra_banners: next });
                        }}
                        className="text-rose-600 font-bold hover:underline"
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-bold shrink-0">배경색:</span>
                      <input
                        type="color"
                        value={bn.bg_color || "#ffffff"}
                        onChange={(e) => {
                          const next = [...(config.extra_banners || [])];
                          next[idx] = { ...bn, bg_color: e.target.value };
                          setConfig({ ...config, extra_banners: next });
                        }}
                        className="w-8 h-8 rounded border border-slate-300 bg-white"
                      />
                      <input
                        type="text"
                        value={bn.bg_color || "#ffffff"}
                        onChange={(e) => {
                          const next = [...(config.extra_banners || [])];
                          next[idx] = { ...bn, bg_color: e.target.value };
                          setConfig({ ...config, extra_banners: next });
                        }}
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-2">
                      <span className="text-slate-500 font-bold shrink-0">이동링크:</span>
                      <input
                        type="text"
                        value={bn.link_url}
                        onChange={(e) => {
                          const next = [...(config.extra_banners || [])];
                          next[idx] = { ...bn, link_url: e.target.value };
                          setConfig({ ...config, extra_banners: next });
                        }}
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. 하단 푸터(Footer) 회사/기관 정보 설정 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-4">
            5. 사이트 하단 (Footer) 사업자 및 고객센터 정보 설정
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-500 mb-1">
                회사/기관명
              </label>
              <input
                type="text"
                value={config.footer.company_name}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    footer: { ...config.footer, company_name: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">
                대표자명
              </label>
              <input
                type="text"
                value={config.footer.ceo_name}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    footer: { ...config.footer, ceo_name: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">
                사업자등록번호
              </label>
              <input
                type="text"
                value={config.footer.biz_no}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    footer: { ...config.footer, biz_no: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">
                통신판매업신고번호
              </label>
              <input
                type="text"
                value={config.footer.sales_no}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    footer: { ...config.footer, sales_no: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-500 mb-1">
                사업장 주소
              </label>
              <input
                type="text"
                value={config.footer.address}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    footer: { ...config.footer, address: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">
                대표 이메일
              </label>
              <input
                type="text"
                value={config.footer.email}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    footer: { ...config.footer, email: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">
                대표 전화번호
              </label>
              <input
                type="text"
                value={config.footer.tel}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    footer: { ...config.footer, tel: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition"
            >
              {saving ? "저장 중..." : "✓ 배너 · 로고 · 사이트 설정 전체 저장"}
            </button>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
