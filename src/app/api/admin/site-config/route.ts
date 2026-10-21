import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb, getSiteConfig, DEFAULT_SITE_CONFIG } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const db = await getDb();
    const config = getSiteConfig(db);
    return NextResponse.json({ ok: true, config });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, config: DEFAULT_SITE_CONFIG, message: err?.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const user = getSessionUser();
  if (!user || user.mb_level < 9) {
    return NextResponse.json(
      { ok: false, message: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const db = await getDb();

    if (body.reset === true) {
      db.site_config = JSON.parse(JSON.stringify(DEFAULT_SITE_CONFIG));
      await saveDb(db);
      return NextResponse.json({
        ok: true,
        config: db.site_config,
        message: "기본 설정으로 초기화되었습니다.",
      });
    }

    const current = getSiteConfig(db);
    db.site_config = {
      ...current,
      ...(body.site_title !== undefined ? { site_title: body.site_title } : {}),
      ...(body.logo_url !== undefined ? { logo_url: body.logo_url } : {}),
      ...(body.logo_width !== undefined
        ? { logo_width: Number(body.logo_width) || 152 }
        : {}),
      top_banner: {
        ...current.top_banner,
        ...(body.top_banner || {}),
      },
      bottom_banner: {
        ...current.bottom_banner,
        ...(body.bottom_banner || {}),
      },
      extra_banners:
        body.extra_banners !== undefined
          ? body.extra_banners
          : current.extra_banners || [],
      footer: {
        ...current.footer,
        ...(body.footer || {}),
      },
    };

    await saveDb(db);
    return NextResponse.json({
      ok: true,
      config: db.site_config,
      message: "배너 및 사이트 디자인 설정이 저장되었습니다.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err?.message || "설정 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
