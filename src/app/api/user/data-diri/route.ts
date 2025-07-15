import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { namaLengkap, nim, npm, jenisKelamin, role } = await request.json();

    // Validate required fields
    if (!namaLengkap || !jenisKelamin || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role-specific fields
    if (role === 'mahasiswa' && !nim) {
      return NextResponse.json(
        { error: 'NIM is required for mahasiswa' },
        { status: 400 }
      );
    }
    if (role === 'dosen' && !npm) {
      return NextResponse.json(
        { error: 'NPM is required for dosen' },
        { status: 400 }
      );
    }

    // Update user with data-diri information
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: namaLengkap,
        nimNpm: role === 'mahasiswa' ? nim : npm,
        isOnboarded: role === 'dosen', // dosen is fully onboarded after data-diri
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving data-diri:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
