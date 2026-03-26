import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/login  { password }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    const adminPassword = process.env.ADMIN_PASSWORD;

    // ADMIN_PASSWORD が未設定の場合は開発用として常に通過
    if (!adminPassword) {
      const response = NextResponse.json({ success: true });
      response.cookies.set("admin_auth", "dev_mode", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 24時間
      });
      return response;
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { error: "パスワードが正しくありません" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_auth", adminPassword, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24時間
    });

    return response;
  } catch (error) {
    console.error("[POST /api/admin/login]", error);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

// POST /api/admin/logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("admin_auth");
  return response;
}
