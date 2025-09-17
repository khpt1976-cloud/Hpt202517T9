export default function DemoLinksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          <h1 className="text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            🏗️ Khuongcuoicung Demo
          </h1>
          
          <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-6 mb-8 text-center">
            <h3 className="text-xl font-semibold mb-2">✅ Trạng thái: HOÀN THÀNH 100%</h3>
            <p className="opacity-90">Ứng dụng đang chạy và sẵn sàng để test!</p>
          </div>

          <div className="grid gap-6 mb-8">
            <div className="bg-white/15 rounded-2xl p-6 hover:bg-white/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-white/20">
              <h3 className="text-xl font-semibold mb-3 text-yellow-400">🏠 Trang chủ</h3>
              <p className="mb-4 opacity-90 leading-relaxed">
                Landing page chuyên nghiệp với đầy đủ thông tin về hệ thống quản lý nhật ký thi công
              </p>
              <a 
                href="https://work-1-zmqjvjyrgabzyrnv.prod-runtime.all-hands.dev/" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600/80 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
              >
                Truy cập →
              </a>
            </div>

            <div className="bg-white/15 rounded-2xl p-6 hover:bg-white/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-white/20">
              <h3 className="text-xl font-semibold mb-3 text-yellow-400">🧪 Testing Dashboard</h3>
              <p className="mb-4 opacity-90 leading-relaxed">
                Dashboard test toàn diện với E2E testing, report generation, permissions và system monitoring
              </p>
              <a 
                href="https://work-1-zmqjvjyrgabzyrnv.prod-runtime.all-hands.dev/test" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600/80 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
              >
                Test ngay →
              </a>
            </div>

            <div className="bg-white/15 rounded-2xl p-6 hover:bg-white/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-white/20">
              <h3 className="text-xl font-semibold mb-3 text-yellow-400">📋 Construction Reports</h3>
              <p className="mb-4 opacity-90 leading-relaxed">
                Quản lý báo cáo thi công với tính năng tạo, chỉnh sửa và theo dõi tiến độ
              </p>
              <a 
                href="https://work-1-zmqjvjyrgabzyrnv.prod-runtime.all-hands.dev/construction-reports" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600/80 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
              >
                Xem báo cáo →
              </a>
            </div>

            <div className="bg-white/15 rounded-2xl p-6 hover:bg-white/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-white/20">
              <h3 className="text-xl font-semibold mb-3 text-yellow-400">📄 Templates</h3>
              <p className="mb-4 opacity-90 leading-relaxed">
                Quản lý template với tính năng upload, đếm trang và xử lý file Word
              </p>
              <a 
                href="https://work-1-zmqjvjyrgabzyrnv.prod-runtime.all-hands.dev/templates" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600/80 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
              >
                Quản lý template →
              </a>
            </div>
          </div>

          <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4 text-blue-300">📊 Thông tin dự án</h3>
            <p className="mb-2"><strong>Repository:</strong> https://github.com/HptAI2025/Khuongcuoicung.git</p>
            <p className="mb-4"><strong>Công nghệ:</strong></p>
            <div className="flex flex-wrap gap-2 mb-6">
              {['Next.js 14', 'React 18', 'TypeScript', 'Prisma', 'SQLite', 'Tailwind CSS', 'Radix UI'].map((tech) => (
                <span key={tech} className="bg-green-500/30 border border-green-500/50 px-3 py-1 rounded-full text-sm">
                  {tech}
                </span>
              ))}
            </div>
            
            <h3 className="text-xl font-semibold mb-3 text-blue-300">🎯 Tính năng chính</h3>
            <ul className="space-y-2 opacity-90">
              <li>✅ Word Document Processing với mammoth.js</li>
              <li>✅ Report Generation từ template</li>
              <li>✅ Permission System với role-based access</li>
              <li>✅ ONLYOFFICE Integration</li>
              <li>✅ Professional UI responsive</li>
              <li>✅ API Backend với 7 endpoints</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}