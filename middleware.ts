import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith('/cms')) return NextResponse.next()

  const auth = req.headers.get('authorization')
  const password = process.env.CMS_PASSWORD ?? 'changeme'
  const validAuth = 'Basic ' + Buffer.from(`admin:${password}`).toString('base64')

  if (auth !== validAuth) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="CMS"' },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/cms', '/cms/:path*'],
}
