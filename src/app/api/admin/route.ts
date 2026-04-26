// Simplified admin API - no complex token system
// Just for future extension if needed

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  return NextResponse.json({ message: "Not implemented - using client-side login" }, { status: 501 });
}

export async function DELETE(req: NextRequest) {
  return NextResponse.json({ message: "Not implemented - using client-side logout" }, { status: 501 });
}
