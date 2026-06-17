import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email, password, nickname } = await req.json();

    if (!email || !password || !nickname) {
      return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        nickname,
        profile: {
          create: {
            weeklyBudget: 50000,
            cookingLevel: '초보',
            maxCookingTime: 15,
            goal: '절약',
            requireFeedback: true
          }
        }
      }
    });

    const token = await signToken({ userId: user.id, email: user.email! });
    
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return NextResponse.json({ success: true, message: '회원가입 성공' });

  } catch (error: any) {
    console.error("Signup Error:", error);
    return NextResponse.json({ error: `오류 상세 내용: ${error.message || String(error)}` }, { status: 500 });
  }
}
