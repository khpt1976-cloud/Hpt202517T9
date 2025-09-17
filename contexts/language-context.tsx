"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Language = "vi" | "en"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  isHydrated: boolean
}

const translations = {
  vi: {
    // Header
    "header.about": "Về chúng tôi",
    "header.services": "Dịch vụ",
    "header.pricing": "Giá", // Added pricing navigation link
    "header.contact": "Liên hệ",
    "header.guide": "Hướng dẫn",
    "header.agents": "Đại lý", // Added agents navigation link
    "header.login": "Đăng nhập",
    "header.start": "Bắt đầu",

    "admin.header.title": "Dashboard Quản trị",
    "common.language": "Ngôn ngữ",
    "adminAgent.header.title": "Quản lý Agent",
    "adminAgent.back": "Quay lại Admin",

    "admin.page.title": "Dashboard Quản trị",
    "admin.page.subtitle": "Tổng quan hệ thống ConstructVN",

    "admin.login.title": "Đăng nhập Admin",
    "admin.login.subtitle": "Truy cập hệ thống quản trị ConstructVN",
    "admin.login.username": "Tài khoản",
    "admin.login.username_placeholder": "Nhập tài khoản",
    "admin.login.password": "Mật khẩu",
    "admin.login.password_placeholder": "Nhập mật khẩu",
    "admin.login.submit": "Đăng nhập",
    "admin.login.error_invalid": "Tài khoản hoặc mật khẩu không đúng",

    "admin.stats.total_users": "Tổng người dùng",
    "admin.stats.monthly_revenue": "Doanh thu tháng",
    "admin.stats.subscriptions": "Gói đăng ký",
    "admin.stats.active_users": "Người dùng hoạt động",
    "admin.stats.change_suffix": "so với tháng trước",

    "admin.revenue_chart.title": "Doanh thu theo tháng",
    "admin.revenue_chart.placeholder": "Biểu đồ doanh thu",

    "admin.recent_users.title": "Người dùng mới",
    "admin.recent_users.user_prefix": "Người dùng",


    "common.back_home": "Quay về trang chủ",

    // Services dropdown
    "services.construction_report": "Nhật ký thi công",
    "services.warehouse_management": "Quản lý kho",
    "services.material_management": "Quản lý vật tư",
    "services.construction_consulting": "Công tác tư vấn xây dựng",
    "services.training": "Đào tạo",
    "services.chatbot": "Chatbot",
    "services.design_calculation": "Tính toán thiết kế", // Added design calculation service
    "services.digital_analysis": "Phân tích cách chơi", // Added digital analysis service

    // Digital Analysis page
    "digital_analysis.title": "Phân tích cách chơi",
    "digital_analysis.subtitle": "Công cụ phân tích dữ liệu bóng đá với AI",
    "digital_analysis.data_config": "Cấu hình Dữ liệu",
    "digital_analysis.analysis": "Phân tích cách chơi",
    "digital_analysis.data_overview": "Tổng quan dữ liệu",
    "digital_analysis.analysis_tools": "Công cụ phân tích",
    "digital_analysis.quick_actions": "Thao tác nhanh",
    "digital_analysis.chart_area": "Khu vực biểu đồ phân tích",
    "digital_analysis.chart_placeholder": "Biểu đồ sẽ hiển thị ở đây sau khi cấu hình dữ liệu",

    "agents.title": "Mạng lưới Đại lý",
    "agents.subtitle":
      "Kết nối với các đối tác đại lý uy tín của ConstructVN trên toàn quốc để được hỗ trợ tốt nhất trong việc triển khai dự án xây dựng của bạn.",
    "agents.search_placeholder": "Tìm kiếm theo khu vực...",
    "agents.search": "Tìm kiếm",
    "agents.total_agents": "Đại lý trên toàn quốc",
    "agents.provinces": "Tỉnh thành",
    "agents.completed_projects": "Dự án hoàn thành",
    "agents.satisfaction": "Độ hài lòng",
    "agents.featured_title": "Đại lý nổi bật",
    "agents.featured_subtitle": "Những đối tác đại lý hàng đầu với kinh nghiệm và uy tín được khách hàng tin tưởng",
    "agents.projects": "Dự án",
    "agents.specialties": "Chuyên môn",
    "agents.contact": "Liên hệ",
    "agents.benefits_title": "Lợi ích khi làm việc với đại lý",
    "agents.benefits_subtitle": "Tại sao bạn nên chọn các đại lý chính thức của ConstructVN",
    "agents.benefit1_title": "Đảm bảo chất lượng",
    "agents.benefit1_desc":
      "Tất cả đại lý đều được đào tạo và chứng nhận bởi ConstructVN, đảm bảo chất lượng dịch vụ cao nhất.",
    "agents.benefit2_title": "Hỗ trợ địa phương",
    "agents.benefit2_desc": "Đại lý hiểu rõ thị trường và quy định địa phương, hỗ trợ bạn hiệu quả nhất.",
    "agents.benefit3_title": "Uy tín được công nhận",
    "agents.benefit3_desc": "Các đại lý đều có kinh nghiệm lâu năm và được khách hàng đánh giá cao về chất lượng.",
    "agents.cta_title": "Quan tâm đến chương trình đại lý?",
    "agents.cta_subtitle": "Tham gia mạng lưới đại lý ConstructVN và mở rộng cơ hội kinh doanh của bạn.",
    "agents.become_agent": "Trở thành đại lý",
    "agents.find_agent": "Tìm đại lý gần bạn",

    // Agent Management
    "agentManagement.overview": "Tổng quan",
    "agentManagement.commission": "Hoa hồng",
    "agentManagement.reports": "Nhật ký",
    "agentManagement.settings": "Cài đặt",
    "agentManagement.totalAgents": "Tổng Agent",
    "agentManagement.activeAgents": "Agent Hoạt động",
    "agentManagement.monthlySales": "Doanh số tháng",
    "agentManagement.commission": "Hoa hồng",
    "agentManagement.agentList": "Danh sách Agent",
    "agentManagement.addAgent": "Thêm Agent",
    "agentManagement.agent": "Agent",
    "agentManagement.contact": "Liên hệ",
    "agentManagement.status": "Trạng thái",
    "agentManagement.sales": "Doanh số",
    "agentManagement.commissionAmount": "Hoa hồng",
    "agentManagement.joinDate": "Ngày tham gia",
    "agentManagement.actions": "Thao tác",
    "agentManagement.active": "Hoạt động",
    "agentManagement.inactive": "Không hoạt động",
    "agentManagement.packages": "gói",
    "agentManagement.monthlyCommission": "Tổng hoa hồng tháng",
    "agentManagement.paidCommission": "Đã thanh toán",
    "agentManagement.pendingCommission": "Chờ thanh toán",
    "agentManagement.commissionHistory": "Lịch sử thanh toán hoa hồng",
    "agentManagement.batchPayment": "Thanh toán hàng loạt",
    "agentManagement.amount": "Số tiền",
    "agentManagement.period": "Kỳ",
    "agentManagement.paymentDate": "Ngày thanh toán",
    "agentManagement.paymentMethod": "Phương thức",
    "agentManagement.paid": "Đã thanh toán",
    "agentManagement.pending": "Chờ thanh toán",
    "agentManagement.processing": "Đang xử lý",
    "agentManagement.notPaid": "Chưa thanh toán",
    "agentManagement.bankTransfer": "Bank Transfer",
    "agentManagement.ewallet": "E-wallet",
    "agentManagement.compareLastMonth": "+{percent}% so với tháng trước",
    "agentManagement.percentOfTotal": "{percent}% tổng agent",
    "agentManagement.percentOfSales": "{percent}% doanh số",
    "agentManagement.percentOfCommission": "{percent}% tổng hoa hồng",

    // Contact page
    "contact.hero.title": "Liên hệ với chúng tôi",
    "contact.hero.description":
      "Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy liên hệ với chúng tôi qua các kênh dưới đây hoặc gửi tin nhắn trực tiếp.",
    "contact.info.title": "Thông tin liên hệ",
    "contact.info.address.title": "Địa chỉ",
    "contact.info.address.value": "123 Đường ABC, Quận 1, TP.HCM, Việt Nam",
    "contact.info.phone.title": "Điện thoại",
    "contact.info.phone.value": "+84 123 456 789",
    "contact.info.email.title": "Email",
    "contact.info.email.value": "contact@constructvn.com",
    "contact.info.hours.title": "Giờ làm việc",
    "contact.info.hours.weekdays": "Thứ 2 - Thứ 6: 8:00 - 17:30",
    "contact.info.hours.weekend": "Thứ 7: 8:00 - 12:00",
    "contact.social.title": "Theo dõi chúng tôi",
    "contact.form.title": "Gửi tin nhắn",
    "contact.form.name": "Họ và tên",
    "contact.form.name_placeholder": "Nhập họ và tên của bạn",
    "contact.form.email": "Email",
    "contact.form.email_placeholder": "Nhập địa chỉ email",
    "contact.form.phone": "Số điện thoại",
    "contact.form.phone_placeholder": "Nhập số điện thoại (tùy chọn)",
    "contact.form.subject": "Chủ đề",
    "contact.form.subject_placeholder": "Nhập chủ đề tin nhắn",
    "contact.form.message": "Tin nhắn",
    "contact.form.message_placeholder": "Nhập nội dung tin nhắn của bạn...",
    "contact.form.send": "Gửi tin nhắn",
    "contact.form.sending": "Đang gửi...",
    "contact.form.success":
      "Cảm ơn bạn! Tin nhắn đã được gửi thành công. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.",
    "contact.map.title": "Vị trí của chúng tôi",
    "contact.map.description": "Tìm chúng tôi tại trung tâm thành phố Hồ Chí Minh",
    "contact.map.placeholder": "Bản đồ sẽ được hiển thị tại đây",

    // About page
    "about.hero.title": "Về ConstructVN",
    "about.hero.description":
      "Chúng tôi là đơn vị tiên phong trong việc số hóa quy trình quản lý dự án xây dựng tại Việt Nam, mang đến những giải pháp công nghệ hiện đại và hiệu quả nhất cho ngành xây dựng.",
    "about.mission.title": "Sứ mệnh",
    "about.mission.description":
      "Cung cấp các giải pháp công nghệ tiên tiến giúp các doanh nghiệp xây dựng tối ưu hóa quy trình quản lý dự án, nâng cao hiệu quả công việc và đảm bảo chất lượng theo tiêu chuẩn Việt Nam.",
    "about.vision.title": "Tầm nhìn",
    "about.vision.description":
      "Trở thành nền tảng quản lý dự án xây dựng hàng đầu Việt Nam, góp phần hiện đại hóa ngành xây dựng và nâng cao năng lực cạnh tranh của các doanh nghiệp Việt Nam trên thị trường quốc tế.",
    "about.values.title": "Giá trị cốt lõi",
    "about.values.subtitle": "Những nguyên tắc định hướng mọi hoạt động của chúng tôi",
    "about.values.quality.title": "Chất lượng",
    "about.values.quality.description": "Cam kết mang đến sản phẩm và dịch vụ chất lượng cao nhất",
    "about.values.customer.title": "Khách hàng",
    "about.values.customer.description": "Đặt lợi ích và sự hài lòng của khách hàng lên hàng đầu",
    "about.values.innovation.title": "Đổi mới",
    "about.values.innovation.description": "Không ngừng cải tiến và ứng dụng công nghệ mới",
    "about.values.trust.title": "Tin cậy",
    "about.values.trust.description": "Xây dựng mối quan hệ dựa trên sự tin tưởng và minh bạch",
    "about.stats.title": "Con số ấn tượng",
    "about.stats.subtitle": "Những thành tựu chúng tôi đã đạt được",
    "about.stats.projects": "Dự án hoàn thành",
    "about.stats.clients": "Khách hàng tin tưởng",
    "about.stats.years": "Năm kinh nghiệm",
    "about.stats.satisfaction": "Độ hài lòng",
    "about.why.title": "Tại sao chọn chúng tôi?",
    "about.why.subtitle": "Những lợi thế vượt trội của ConstructVN",
    "about.why.experience.title": "Kinh nghiệm phong phú",
    "about.why.experience.description": "Hơn 5 năm kinh nghiệm trong lĩnh vực công nghệ xây dựng",
    "about.why.technology.title": "Công nghệ tiên tiến",
    "about.why.technology.description": "Ứng dụng những công nghệ mới nhất trong quản lý dự án",
    "about.why.support.title": "Hỗ trợ tận tâm",
    "about.why.support.description": "Đội ngũ hỗ trợ chuyên nghiệp 24/7",
    "about.why.compliance.title": "Tuân thủ chuẩn mực",
    "about.why.compliance.description": "Đảm bảo tuân thủ các quy định và tiêu chuẩn Việt Nam",
    "about.why.award.title": "Được công nhận",
    "about.why.award.description": "Nhận được nhiều giải thưởng và chứng nhận uy tín trong ngành",
    "about.why.get_started": "Bắt đầu ngay",

    // Register page
    "register.title": "Tạo tài khoản",
    "register.subtitle": "Bắt đầu hành trình quản lý dự án xây dựng của bạn",
    "register.google": "Đăng ký với Google",
    "register.facebook": "Đăng ký với Facebook",
    "register.or": "hoặc",
    "register.fullname": "Họ và tên",
    "register.fullname_placeholder": "Nhập họ và tên đầy đủ",
    "register.email": "Email",
    "register.email_placeholder": "Nhập địa chỉ email",
    "register.password": "Mật khẩu",
    "register.password_placeholder": "Tạo mật khẩu mạnh",
    "register.confirm_password": "Xác nhận mật khẩu",
    "register.confirm_password_placeholder": "Nhập lại mật khẩu",
    "register.password_requirements": "Mật khẩu phải có ít nhất 8 ký tự",
    "register.create_account": "Tạo tài khoản",
    "register.have_account": "Đã có tài khoản?",
    "register.sign_in": "Đăng nhập",
    "register.back_home": "Quay về trang chủ",
    "register.errors.fullname_required": "Vui lòng nhập họ và tên",
    "register.errors.email_required": "Vui lòng nhập email",
    "register.errors.email_invalid": "Email không hợp lệ",
    "register.errors.password_required": "Vui lòng nhập mật khẩu",
    "register.errors.password_length": "Mật khẩu phải có ít nhất 8 ký tự",
    "register.errors.confirm_password_required": "Vui lòng xác nhận mật khẩu",
    "register.errors.password_mismatch": "Mật khẩu xác nhận không khớp",

    // Login modal
    "login.title": "Đăng nhập",
    "login.subtitle": "Chọn phương thức đăng nhập để tiếp tục",
    "login.facebook": "Đăng nhập với Facebook",
    "login.google": "Đăng nhập với Google",
    "login.or": "hoặc",
    "login.email": "Email",
    "login.email_placeholder": "Nhập địa chỉ email",
    "login.password": "Mật khẩu",
    "login.password_placeholder": "Nhập mật khẩu",
    "login.sign_in_email": "Đăng nhập với Email",
    "login.signing_in": "Đang đăng nhập...",
    "login.forgot_password": "Quên mật khẩu?",

    // User menu
    "user_menu.profile": "Thông tin cá nhân",
    "user_menu.settings": "Cài đặt",
    "user_menu.projects": "Dự án của tôi",
    "user_menu.billing": "Thanh toán",
    "user_menu.help": "Trợ giúp",
    "user_menu.logout": "Đăng xuất",

    // Hero section
    "hero.title": "Hệ thống Quản lý\nNhật ký Thi công\nChuyên nghiệp",
    "hero.description":
      "Giải pháp số hóa toàn diện cho việc quản lý dự án xây dựng, từ lập nhật ký đến theo dõi tiến độ thi công theo chuẩn Việt Nam.",
    "hero.start_free": "Bắt đầu miễn phí",
    "hero.view_demo": "Xem demo",
    "hero.video_intro": "Video giới thiệu hệ thống",

    // Features section
    "features.title": "Tính năng nổi bật",
    "features.subtitle": "Hệ thống quản lý dự án xây dựng toàn diện với các công cụ chuyên nghiệp",
    "features.project_management": "Quản lý Dự án",
    "features.project_management_desc":
      "Tạo và quản lý nhiều dự án xây dựng, phân chia công việc và theo dõi tiến độ một cách khoa học.",
    "features.construction_diary": "Nhật ký Thi công",
    "features.construction_diary_desc":
      "Tạo nhật ký nhật ký thi công theo mẫu chuẩn Việt Nam với tính năng tự động hóa thông minh.",
    "features.team_management": "Quản lý Nhóm",
    "features.team_management_desc":
      "Phân quyền người dùng theo vai trò Admin, Manager, User với các chức năng phù hợp.",
    "features.learn_more": "Tìm hiểu thêm →",

    // Why choose us section
    "why.title": "Tại sao chọn chúng tôi?",
    "why.vietnam_standard": "Tuân thủ chuẩn Việt Nam",
    "why.vietnam_standard_desc": "Mẫu nhật ký được thiết kế theo đúng quy định pháp lý và chuẩn kỹ thuật Việt Nam.",
    "why.friendly_interface": "Giao diện thân thiện",
    "why.friendly_interface_desc":
      "Thiết kế đơn giản, dễ sử dụng phù hợp với mọi đối tượng người dùng trong ngành xây dựng.",
    "why.high_security": "Bảo mật cao",
    "why.high_security_desc": "Dữ liệu được mã hóa và bảo vệ theo tiêu chuẩn quốc tế, đảm bảo an toàn thông tin dự án.",
    "why.support_247": "Hỗ trợ 24/7",
    "why.support_247_desc": "Đội ngũ hỗ trợ chuyên nghiệp sẵn sàng hỗ trợ bạn mọi lúc, mọi nơi.",
    "why.trusted_by": "Được tin tưởng bởi",
    "why.companies": "Doanh nghiệp xây dựng",

    // Testimonials section
    "testimonials.title": "Khách hàng nói gì về chúng tôi",
    "testimonials.subtitle": "Những phản hồi tích cực từ các doanh nghiệp đã sử dụng hệ thống",
    "testimonials.review1":
      "Hệ thống giúp chúng tôi tiết kiệm rất nhiều thời gian trong việc lập nhật ký. Giao diện đơn giản, dễ sử dụng.",
    "testimonials.review2":
      "Tính năng quản lý dự án rất tốt, phù hợp cho những dự án lớn theo dõi tiến độ một cách hiệu quả.",
    "testimonials.review3": "Hỗ trợ khách hàng rất tốt, phản hồi nhanh chóng và giải quyết vấn đề hiệu quả.",

    // CTA section
    "cta.title": "Sẵn sàng bắt đầu?",
    "cta.subtitle":
      "Tham gia cùng hàng nghìn doanh nghiệp đã tin tưởng sử dụng\nConstructVN để quản lý dự án xây dựng.",
    "cta.placeholder": "Bắt đầu miễn phí ngay",
    "cta.register": "Đăng ký",

    // Footer
    "footer.description":
      "Nền tảng quản lý dự án xây dựng hàng đầu Việt Nam. Giúp bạn quản lý dự án hiệu quả, theo dõi tiến độ và tối ưu hóa chi phí một cách chuyên nghiệp.",
    "footer.company": "Công ty",
    "footer.about": "Về chúng tôi",
    "footer.services": "Dịch vụ",
    "footer.news": "Tin tức",
    "footer.careers": "Tuyển dụng",
    "footer.support": "Hỗ trợ",
    "footer.help_center": "Trung tâm trợ giúp",
    "footer.contact": "Liên hệ",
    "footer.report_bug": "Nhật ký lỗi",
    "footer.feature_request": "Yêu cầu tính năng",
    "footer.legal": "Pháp lý",
    "footer.terms": "Điều khoản sử dụng",
    "footer.privacy": "Chính sách bảo mật",
    "footer.cookies": "Chính sách cookie",
    "footer.community": "Quy định cộng đồng",
    "footer.newsletter": "Đăng ký nhận tin tức",
    "footer.newsletter_desc": "Nhận thông tin cập nhật về tính năng và tin tức ngành xây dựng",
    "footer.email_placeholder": "Nhập email của bạn",
    "footer.subscribe": "Đăng ký",
    "footer.copyright": "© 2025 ConstructVN. Tất cả quyền được bảo lưu.",

    // Pricing section
    "pricing.title": "Bảng giá dịch vụ",
    "pricing.subtitle": "Chọn gói dịch vụ phù hợp với nhu cầu của doanh nghiệp bạn",
    "pricing.month": "tháng",
    "pricing.year": "năm",
    "pricing.monthly": "Hàng tháng",
    "pricing.yearly": "Hàng năm",
    "pricing.save_percent": "Tiết kiệm {percent}%",
    "pricing.billing_cycle": "Chu kỳ thanh toán",
    "pricing.popular": "Phổ biến",
    "pricing.choose_plan": "Chọn gói này",

    // Free plan
    "pricing.free.name": "Miễn phí",
    "pricing.free.description": "Dùng thử miễn phí cho cá nhân",
    "pricing.free.price": "₫0",
    "pricing.free.price_yearly": "₫0",
    "pricing.free.feature1": "Quản lý tối đa 1 dự án",
    "pricing.free.feature2": "Nhật ký cơ bản",
    "pricing.free.feature3": "1GB lưu trữ",

    // Basic plan
    "pricing.basic.name": "Cơ bản",
    "pricing.basic.description": "Phù hợp cho dự án nhỏ và startup",
    "pricing.basic.price_monthly": "₫299,000",
    "pricing.basic.price_yearly": "₫2,990,000",
    "pricing.basic.feature1": "Quản lý tối đa 5 dự án",
    "pricing.basic.feature2": "Nhật ký thi công cơ bản",
    "pricing.basic.feature3": "Hỗ trợ email",
    "pricing.basic.feature4": "10GB lưu trữ",

    // Professional plan
    "pricing.professional.name": "Chuyên nghiệp",
    "pricing.professional.description": "Tối ưu cho doanh nghiệp vừa và nhỏ",
    "pricing.professional.price_monthly": "₫599,000",
    "pricing.professional.price_yearly": "₫5,990,000",
    "pricing.professional.feature1": "Quản lý không giới hạn dự án",
    "pricing.professional.feature2": "Nhật ký thi công nâng cao",
    "pricing.professional.feature3": "Quản lý nhóm và phân quyền",
    "pricing.professional.feature4": "Hỗ trợ điện thoại và email",
    "pricing.professional.feature5": "100GB lưu trữ",

    // Enterprise plan
    "pricing.enterprise.name": "Doanh nghiệp",
    "pricing.enterprise.description": "Giải pháp toàn diện cho tập đoàn lớn",
    "pricing.enterprise.price_monthly": "₫1,299,000",
    "pricing.enterprise.price_yearly": "₫12,990,000",
    "pricing.enterprise.feature1": "Tất cả tính năng Professional",
    "pricing.enterprise.feature2": "API tích hợp tùy chỉnh",
    "pricing.enterprise.feature3": "Nhật ký phân tích chuyên sâu",
    "pricing.enterprise.feature4": "Hỗ trợ 24/7 ưu tiên",
    "pricing.enterprise.feature5": "Lưu trữ không giới hạn",
    "pricing.enterprise.feature6": "Đào tạo và tư vấn chuyên môn",

    // Forgot password page
    "forgot_password.title": "Quên mật khẩu",
    "forgot_password.description": "Nhập địa chỉ email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu",
    "forgot_password.email_label": "Địa chỉ email",
    "forgot_password.email_placeholder": "Nhập email của bạn",
    "forgot_password.send_reset": "Gửi link đặt lại",
    "forgot_password.sending": "Đang gửi...",
    "forgot_password.back_to_login": "Quay lại đăng nhập",
    "forgot_password.success_title": "Email đã được gửi!",
    "forgot_password.success_description":
      "Chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.",
    "forgot_password.success_back": "Quay lại trang chủ",
    "forgot_password.errors.email_required": "Vui lòng nhập địa chỉ email",
    "forgot_password.errors.email_invalid": "Địa chỉ email không hợp lệ",

    // Construction Reports page
    "construction_diaries.title": "Quản lý Nhật ký Thi công",
    "construction_diaries.subtitle": "Quản lý nhật ký thi công cho các dự án xây dựng",
    "construction_diaries.back_home": "Trang chủ",
    "construction_diaries.template_title": "Mẫu nhật ký Word",
    "construction_diaries.template_required": "Bắt buộc",
    "construction_diaries.template_upload": "Upload file Word mẫu (Bắt buộc)",
    "construction_diaries.template_accept": "Chỉ chấp nhận file Word (.docx)",
    "construction_diaries.template_warning": "LƯU Ý QUAN TRỌNG:",
    "construction_diaries.template_note": "Trang cuối cùng của file mẫu luôn phải là trang trắng",
    "construction_diaries.template_drag": "Kéo thả file .docx vào đây hoặc click để chọn file",
    "construction_diaries.template_choose": "Chọn file Word (Bắt buộc)",
    "construction_diaries.template_description": "File Word mẫu sẽ được sử dụng làm template cho tất cả nhật ký",
    "construction_diaries.template_last_page": "Đảm bảo trang cuối là trang trắng",

    "construction_diaries.project_groups": "Dự án",
    "construction_diaries.create_project_group": "Tạo",
    "construction_diaries.select_project_group": "Chọn dự án để xem hạng mục",
    "construction_diaries.project_group_name": "Tên dự án",
    "construction_diaries.project_group_description": "Mô tả dự án",
    "construction_diaries.project_group_status": "Trạng thái",

    "construction_diaries.constructions": "Hạng mục",
    "construction_diaries.create_construction": "Tạo",
    "construction_diaries.select_construction": "Chọn hạng mục để xem gói thầu",
    "construction_diaries.construction_name": "Tên hạng mục",
    "construction_diaries.construction_location": "Địa điểm",
    "construction_diaries.construction_manager": "Quản lý",
    "construction_diaries.construction_status": "Trạng thái",

    "construction_diaries.description": "Mô tả",
    "construction_diaries.manager": "Quản lý",
    "construction_diaries.status": "Trạng thái",
    "construction_diaries.location": "Địa điểm",
    "construction_diaries.update": "Cập nhật",
    "construction_diaries.cancel": "Hủy",
    "construction_diaries.status_active": "Đang thực hiện",
    "construction_diaries.status_completed": "Hoàn thành",
    "construction_diaries.status_on_hold": "Tạm dừng",
    "construction_diaries.status_in_progress": "Đang thực hiện",

    // Projects section (kept for backward compatibility)
    "construction_diaries.projects": "Hạng mục",
    "construction_diaries.create_project": "Tạo",
    "construction_diaries.select_project": "Chọn hạng mục để xem gói thầu",
    "construction_diaries.project_name": "Tên hạng mục",
    "construction_diaries.project_location": "Địa điểm",
    "construction_diaries.project_manager": "Quản lý",
    "construction_diaries.project_status": "Trạng thái",

    // Categories section
    "construction_diaries.categories": "Gói thầu",
    "construction_diaries.create_category": "Tạo",
    "construction_diaries.select_category": "Chọn gói thầu để xem nhật ký",
    "construction_diaries.category_name": "Tên gói thầu",
    "construction_diaries.category_description": "Mô tả",

    // Reports section
    "construction_diaries.reports": "Nhật ký",
    "construction_diaries.diaries": "Nhật ký",
    "construction_diaries.create_report": "Tạo",
    "construction_diaries.create_diary": "Tạo",
    "construction_diaries.select_report": "Chọn gói thầu để xem nhật ký",
    "construction_diaries.select_diary": "Chọn gói thầu để xem nhật ký",
    "construction_diaries.report_title": "Tiêu đề nhật ký",
    "construction_diaries.diary_title": "Tiêu đề nhật ký",

    // Status options
    "construction_diaries.status.active": "Đang thực hiện",
    "construction_diaries.status.completed": "Hoàn thành",
    "construction_diaries.status.paused": "Tạm dừng",
    "construction_diaries.status.pending": "Chờ thực hiện",
    "construction_diaries.status.in_progress": "Đang thực hiện",
    "construction_diaries.status.draft": "Bản nháp",
    "construction_diaries.status.approved": "Đã duyệt",

    // Statistics
    "construction_diaries.stats.total_projects": "Tổng hạng mục",
    "construction_diaries.stats.total_categories": "Tổng gói thầu",
    "construction_diaries.stats.total_reports": "Tổng nhật ký",
    "construction_diaries.stats.in_progress": "Đang thực hiện",

    // Modal titles
    "construction_diaries.modal.create_project": "Tạo hạng mục mới",
    "construction_diaries.modal.edit_project": "Chỉnh sửa hạng mục",
    "construction_diaries.modal.create_category": "Tạo gói thầu mới",
    "construction_diaries.modal.edit_category": "Chỉnh sửa gói thầu",
    "construction_diaries.modal.create_report": "Tạo nhật ký mới",
    "construction_diaries.modal.create_diary": "Tạo nhật ký mới",
    "construction_diaries.modal.edit_report": "Chỉnh sửa nhật ký",
    "construction_diaries.modal.edit_diary": "Chỉnh sửa nhật ký",

    "construction_diaries.modal.create_project_group": "Tạo dự án mới",
    "construction_diaries.modal.edit_project_group": "Chỉnh sửa dự án",
    "construction_diaries.modal.create_construction": "Tạo hạng mục mới",
    "construction_diaries.modal.edit_construction": "Chỉnh sửa hạng mục",

    // Common actions
    "construction_diaries.actions.cancel": "Hủy",
    "construction_diaries.actions.create": "Tạo",
    "construction_diaries.actions.update": "Cập nhật",
    "construction_diaries.actions.delete": "Xóa",
    "construction_diaries.actions.edit": "Chỉnh sửa",

    // Delete confirmations
    "construction_diaries.delete.confirm_title": "Xác nhận xóa",
    "construction_diaries.delete.project_message": "Bạn có chắc chắn muốn xóa hạng mục này không?",
    "construction_diaries.delete.project_warning":
      "Tất cả gói thầu và nhật ký liên quan sẽ bị xóa. Hành động này không thể hoàn tác.",
    "construction_diaries.delete.category_message": "Bạn có chắc chắn muốn xóa gói thầu này không?",
    "construction_diaries.delete.category_warning":
      "Tất cả nhật ký liên quan sẽ bị xóa. Hành động này không thể hoàn tác.",
    "construction_diaries.delete.report_message": "Bạn có chắc chắn muốn xóa nhật ký này không?",
    "construction_diaries.delete.report_warning": "Nhật ký sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.",
    "construction_diaries.delete.template_message": "Bạn có chắc chắn muốn xóa file Word mẫu này không?",
    "construction_diaries.delete.template_warning":
      "File mẫu sẽ bị xóa khỏi hệ thống. Hành động này không thể hoàn tác.",
    "construction_diaries.confirm_delete_template": "Bạn có chắc chắn muốn xóa file Word mẫu này không?",
    "construction_diaries.delete_template_warning":
      "File mẫu sẽ bị xóa khỏi hệ thống. Hành động này không thể hoàn tác.",

    "construction_diaries.delete.project_group_message": "Bạn có chắc chắn muốn xóa dự án này không?",
    "construction_diaries.delete.project_group_warning":
      "Tất cả hạng mục, gói thầu và nhật ký liên quan sẽ bị xóa. Hành động này không thể hoàn tác.",
    "construction_diaries.delete.construction_message": "Bạn có chắc chắn muốn xóa hạng mục này không?",
    "construction_diaries.delete.construction_warning":
      "Tất cả gói thầu và nhật ký liên quan sẽ bị xóa. Hành động này không thể hoàn tác.",

    "construction_diaries.cancel": "Hủy",
    "construction_diaries.delete": "Xóa",
    "construction_diaries.confirm_delete": "Xác nhận xóa",
    "construction_diaries.confirm_delete_construction": "Bạn có chắc chắn muốn xóa hạng mục này không?",
    "construction_diaries.delete_construction_warning":
      "Tất cả gói thầu và nhật ký liên quan sẽ bị xóa. Hành động này không thể hoàn tác.",

    // Report Editor page
    "editor.back": "Quay lại",
    "editor.page": "Trang",
    "editor.group": "Nhóm",
    "editor.add_diary": "Tạo thêm nhật ký",
    "editor.add_diary_desc": "Nhân bản trang 7-8 góc của file mẫu",
    "editor.share_report": "Chia sẻ nhật ký",
    "editor.lock_unlock": "Khóa/Mở khóa trang",
    "editor.lock_all": "Khóa trang",
    "editor.unlock_all": "Mở khóa trang",
    "editor.page_navigation": "Trang thật trang",
    "editor.document_info": "Thông tin tài liệu",
    "editor.total_pages": "Tổng trang",
    "editor.locked_pages": "Trang khóa",
    "editor.updated": "Cập nhật",
    "editor.preview": "Xem trước",
    "editor.save": "Lưu",
    "editor.print": "In",
    "editor.loading": "Đang tải trình soạn thảo...",
    "editor.error_loading": "Lỗi tải trình soạn thảo",
    "editor.construction_images": "Hình ảnh thi công",
    "editor.image": "Ảnh",
    "editor.page_content": "Nội dung trang",
    "editor.demo_content":
      "Đây là nội dung từ file Word mẫu cho trang {page}. Trong thực tế, nội dung này sẽ được lấy từ file Word mẫu đã upload và hiển thị với định dạng gốc.",
    "editor.demo_mode": "Demo mode - Cần ONLYOFFICE Server để soạn thảo thực tế",
    "editor.auto_save": "Tự động lưu",
    "editor.onlyoffice_placeholder": "ONLYOFFICE Editor sẽ hiển thị ở đây",

    // Share modal
    "editor.share.title": "Chia sẻ nhật ký",
    "editor.share.email_specific": "Chia sẻ với email cụ thể",
    "editor.share.email_placeholder": "Nhập email người nhận",
    "editor.share.add_email": "Thêm email",
    "editor.share.shared_with": "Người được chia sẻ:",
    "editor.share.all_members": "Chia sẻ với tất cả thành viên",
    "editor.share.cancel": "Hủy",
    "editor.share.share": "Chia sẻ",
    "editor.share.email_error_required": "Vui lòng nhập email",
    "editor.share.email_error_invalid": "Email không đúng định dạng",
    "editor.share.email_error_exists": "Email này đã được thêm",

    // Lock/Unlock modal
    "editor.lock.title": "Khóa trang",
    "editor.unlock.title": "Mở khóa trang",
    "editor.lock.select_all": "Chọn tất cả trang",
    "editor.lock.select_specific": "Chọn trang cụ thể:",
    "editor.lock.selected_count": "Đã chọn {count} trang: {pages}",
    "editor.lock.lock_pages": "Khóa trang",
    "editor.unlock.unlock_pages": "Mở khóa trang",
  },
  en: {
    // Header
    "header.about": "About Us",
    "header.services": "Services",

    "admin.header.title": "Admin Dashboard",
    "common.language": "Language",
    "adminAgent.header.title": "Agent Management",
    "adminAgent.back": "Back to Admin",

    "admin.page.title": "Admin Dashboard",
    "admin.page.subtitle": "ConstructVN system overview",

    "admin.login.title": "Admin Login",
    "admin.login.subtitle": "Access ConstructVN admin system",
    "admin.login.username": "Username",
    "admin.login.username_placeholder": "Enter username",
    "admin.login.password": "Password",
    "admin.login.password_placeholder": "Enter password",
    "admin.login.submit": "Login",
    "admin.login.error_invalid": "Invalid username or password",

    "admin.stats.total_users": "Total users",
    "admin.stats.monthly_revenue": "Monthly revenue",
    "admin.stats.subscriptions": "Subscriptions",
    "admin.stats.active_users": "Active users",
    "admin.stats.change_suffix": "vs last month",

    "admin.revenue_chart.title": "Revenue by month",
    "admin.revenue_chart.placeholder": "Revenue chart",

    "admin.recent_users.title": "New users",
    "admin.recent_users.user_prefix": "User",

    "header.pricing": "Pricing", // Added pricing navigation link
    "header.contact": "Contact",
    "header.guide": "Guide",
    "header.agents": "Agents", // Added agents navigation link
    "header.login": "Login",
    "header.start": "Get Started",

    "common.back_home": "Back to Home",

    // Services dropdown
    "services.construction_report": "Construction Reports",
    "services.warehouse_management": "Warehouse Management",
    "services.material_management": "Material Management",
    "services.construction_consulting": "Construction Consulting",
    "services.training": "Training",
    "services.chatbot": "Chatbot",
    "services.design_calculation": "Design Calculation", // Added design calculation service
    "services.digital_analysis": "Digital Analysis", // Added digital analysis service

    // Digital Analysis page
    "digital_analysis.title": "Digital Analysis",
    "digital_analysis.subtitle": "Smart construction data analysis tool with AI",
    "digital_analysis.data_config": "Data Configuration",
    "digital_analysis.analysis": "Digital Analysis",
    "digital_analysis.data_overview": "Data Overview",
    "digital_analysis.analysis_tools": "Analysis Tools",
    "digital_analysis.quick_actions": "Quick Actions",
    "digital_analysis.chart_area": "Analysis Chart Area",
    "digital_analysis.chart_placeholder": "Charts will be displayed here after data configuration",

    // Agent Management
    "agentManagement.overview": "Overview",
    "agentManagement.commission": "Commission",
    "agentManagement.reports": "Reports",
    "agentManagement.settings": "Settings",
    "agentManagement.totalAgents": "Total Agents",
    "agentManagement.activeAgents": "Active Agents",
    "agentManagement.monthlySales": "Monthly Sales",
    "agentManagement.commission": "Commission",
    "agentManagement.agentList": "Agent List",
    "agentManagement.addAgent": "Add Agent",
    "agentManagement.agent": "Agent",
    "agentManagement.contact": "Contact",
    "agentManagement.status": "Status",
    "agentManagement.sales": "Sales",
    "agentManagement.commissionAmount": "Commission",
    "agentManagement.joinDate": "Join Date",
    "agentManagement.actions": "Actions",
    "agentManagement.active": "Active",
    "agentManagement.inactive": "Inactive",
    "agentManagement.packages": "packages",
    "agentManagement.monthlyCommission": "Monthly Commission Total",
    "agentManagement.paidCommission": "Paid",
    "agentManagement.pendingCommission": "Pending Payment",
    "agentManagement.commissionHistory": "Commission Payment History",
    "agentManagement.batchPayment": "Batch Payment",
    "agentManagement.amount": "Amount",
    "agentManagement.period": "Period",
    "agentManagement.paymentDate": "Payment Date",
    "agentManagement.paymentMethod": "Method",
    "agentManagement.paid": "Paid",
    "agentManagement.pending": "Pending",
    "agentManagement.processing": "Processing",
    "agentManagement.notPaid": "Not Paid",
    "agentManagement.bankTransfer": "Bank Transfer",
    "agentManagement.ewallet": "E-wallet",
    "agentManagement.compareLastMonth": "+{percent}% vs last month",
    "agentManagement.percentOfTotal": "{percent}% of total agents",
    "agentManagement.percentOfSales": "{percent}% of sales",
    "agentManagement.percentOfCommission": "{percent}% of total commission",

    // Contact page
    "contact.hero.title": "Contact Us",
    "contact.hero.description":
      "We are always ready to listen and support you. Contact us through the channels below or send us a direct message.",
    "contact.info.title": "Contact Information",
    "contact.info.address.title": "Address",
    "contact.info.address.value": "123 ABC Street, District 1, Ho Chi Minh City, Vietnam",
    "contact.info.phone.title": "Phone",
    "contact.info.phone.value": "+84 123 456 789",
    "contact.info.email.title": "Email",
    "contact.info.email.value": "contact@constructvn.com",
    "contact.info.hours.title": "Working Hours",
    "contact.info.hours.weekdays": "Monday - Friday: 8:00 AM - 5:30 PM",
    "contact.info.hours.weekend": "Saturday: 8:00 AM - 12:00 PM",
    "contact.social.title": "Follow Us",
    "contact.form.title": "Send Message",
    "contact.form.name": "Full Name",
    "contact.form.name_placeholder": "Enter your full name",
    "contact.form.email": "Email",
    "contact.form.email_placeholder": "Enter your email address",
    "contact.form.phone": "Phone Number",
    "contact.form.phone_placeholder": "Enter phone number (optional)",
    "contact.form.subject": "Subject",
    "contact.form.subject_placeholder": "Enter message subject",
    "contact.form.message": "Message",
    "contact.form.message_placeholder": "Enter your message content...",
    "contact.form.send": "Send Message",
    "contact.form.sending": "Sending...",
    "contact.form.success": "Thank you! Your message has been sent successfully. We will respond as soon as possible.",
    "contact.map.title": "Our Location",
    "contact.map.description": "Find us in the heart of Ho Chi Minh City",
    "contact.map.placeholder": "Map will be displayed here",

    // About page
    "about.hero.title": "About ConstructVN",
    "about.hero.description":
      "We are pioneers in digitizing construction project management processes in Vietnam, bringing the most modern and effective technology solutions to the construction industry.",
    "about.mission.title": "Mission",
    "about.mission.description":
      "Provide advanced technology solutions to help construction businesses optimize project management processes, improve work efficiency and ensure quality according to Vietnamese standards.",
    "about.vision.title": "Vision",
    "about.vision.description":
      "Become the leading construction project management platform in Vietnam, contributing to modernizing the construction industry and enhancing the competitiveness of Vietnamese businesses in the international market.",
    "about.values.title": "Core Values",
    "about.values.subtitle": "The principles that guide all our activities",
    "about.values.quality.title": "Quality",
    "about.values.quality.description": "Committed to delivering the highest quality products and services",
    "about.values.customer.title": "Customer",
    "about.values.customer.description": "Put customer interests and satisfaction first",
    "about.values.innovation.title": "Innovation",
    "about.values.innovation.description": "Continuously improve and apply new technologies",
    "about.values.trust.title": "Trust",
    "about.values.trust.description": "Build relationships based on trust and transparency",
    "about.stats.title": "Impressive Numbers",
    "about.stats.subtitle": "The achievements we have accomplished",
    "about.stats.projects": "Completed Projects",
    "about.stats.clients": "Trusted Clients",
    "about.stats.years": "Years of Experience",
    "about.stats.satisfaction": "Satisfaction Rate",
    "about.why.title": "Why Choose Us?",
    "about.why.subtitle": "ConstructVN's outstanding advantages",
    "about.why.experience.title": "Rich Experience",
    "about.why.experience.description": "Over 5 years of experience in construction technology",
    "about.why.technology.title": "Advanced Technology",
    "about.why.technology.description": "Apply the latest technologies in project management",
    "about.why.support.title": "Dedicated Support",
    "about.why.support.description": "Professional 24/7 support team",
    "about.why.compliance.title": "Standards Compliance",
    "about.why.compliance.description": "Ensure compliance with Vietnamese regulations and standards",
    "about.why.award.title": "Recognized",
    "about.why.award.description": "Received many prestigious awards and certifications in the industry",
    "about.why.get_started": "Get Started",

    // Register page
    "register.title": "Create Account",
    "register.subtitle": "Start your construction project management journey",
    "register.google": "Sign up with Google",
    "register.facebook": "Sign up with Facebook",
    "register.or": "or",
    "register.fullname": "Full Name",
    "register.fullname_placeholder": "Enter your full name",
    "register.email": "Email",
    "register.email_placeholder": "Enter your email address",
    "register.password": "Password",
    "register.password_placeholder": "Create a strong password",
    "register.confirm_password": "Confirm Password",
    "register.confirm_password_placeholder": "Re-enter your password",
    "register.password_requirements": "Password must be at least 8 characters",
    "register.create_account": "Create Account",
    "register.have_account": "Already have an account?",
    "register.sign_in": "Sign In",
    "register.back_home": "Back to Home",
    "register.errors.fullname_required": "Please enter your full name",
    "register.errors.email_required": "Please enter your email",
    "register.errors.email_invalid": "Invalid email address",
    "register.errors.password_required": "Please enter a password",
    "register.errors.password_length": "Password must be at least 8 characters",
    "register.errors.confirm_password_required": "Please confirm your password",
    "register.errors.password_mismatch": "Passwords do not match",

    // Login modal
    "login.title": "Sign In",
    "login.subtitle": "Choose your preferred sign-in method to continue",
    "login.facebook": "Continue with Facebook",
    "login.google": "Continue with Google",
    "login.or": "or",
    "login.email": "Email",
    "login.email_placeholder": "Enter your email address",
    "login.password": "Password",
    "login.password_placeholder": "Enter your password",
    "login.sign_in_email": "Sign in with Email",
    "login.signing_in": "Signing in...",
    "login.forgot_password": "Forgot password?",

    // User menu
    "user_menu.profile": "Profile",
    "user_menu.settings": "Settings",
    "user_menu.projects": "My Projects",
    "user_menu.billing": "Billing",
    "user_menu.help": "Help",
    "user_menu.logout": "Sign Out",

    // Hero section
    "hero.title": "Professional\nConstruction Diary\nManagement System",
    "hero.description":
      "Comprehensive digital solution for construction project management, from reporting to progress tracking according to Vietnamese standards.",
    "hero.start_free": "Start Free",
    "hero.view_demo": "View Demo",
    "hero.video_intro": "System Introduction Video",

    // Features section
    "features.title": "Outstanding Features",
    "features.subtitle": "Comprehensive construction project management system with professional tools",
    "features.project_management": "Project Management",
    "features.project_management_desc":
      "Create and manage multiple construction projects, divide work and track progress scientifically.",
    "features.construction_diary": "Construction Diary",
    "features.construction_diary_desc":
      "Create construction diary reports according to Vietnamese standards with intelligent automation features.",
    "features.team_management": "Team Management",
    "features.team_management_desc": "Assign user permissions by role Admin, Manager, User with appropriate functions.",
    "features.learn_more": "Learn more →",

    // Why choose us section
    "why.title": "Why Choose ConstructVN?",
    "why.vietnam_standard": "Vietnamese Standard Compliance",
    "why.vietnam_standard_desc":
      "Report templates designed according to Vietnamese legal regulations and technical standards.",
    "why.friendly_interface": "User-Friendly Interface",
    "why.friendly_interface_desc": "Simple, easy-to-use design suitable for all users in the construction industry.",
    "why.high_security": "High Security",
    "why.high_security_desc":
      "Data encrypted and protected according to international standards, ensuring project information security.",
    "why.support_247": "24/7 Support",
    "why.support_247_desc": "Professional support team ready to assist you anytime, anywhere.",
    "why.trusted_by": "Trusted by",
    "why.companies": "Construction Companies",

    // Testimonials section
    "testimonials.title": "What Our Customers Say",
    "testimonials.subtitle": "Positive feedback from businesses that have used the system",
    "testimonials.review1": "The system helps us save a lot of time in reporting. Simple interface, easy to use.",
    "testimonials.review2":
      "The project management feature is very good, suitable for large projects to track progress effectively.",
    "testimonials.review3": "Customer support is very good, quick response and effective problem solving.",

    // CTA section
    "cta.title": "Ready to Get Started?",
    "cta.subtitle": "Join thousands of businesses that trust\nConstructVN for construction project management.",
    "cta.placeholder": "Start free now",
    "cta.register": "Register",

    // Footer
    "footer.description":
      "Leading construction project management platform in Vietnam. Help you manage projects effectively, track progress and optimize costs professionally.",
    "footer.company": "Company",
    "footer.about": "About Us",
    "footer.services": "Services",
    "footer.news": "News",
    "footer.careers": "Careers",
    "footer.support": "Support",
    "footer.help_center": "Help Center",
    "footer.contact": "Contact",
    "footer.report_bug": "Report Bug",
    "footer.feature_request": "Feature Request",
    "footer.legal": "Legal",
    "footer.terms": "Terms of Service",
    "footer.privacy": "Privacy Policy",
    "footer.cookies": "Cookie Policy",
    "footer.community": "Community Guidelines",
    "footer.newsletter": "Subscribe to Newsletter",
    "footer.newsletter_desc": "Get updates on features and construction industry news",
    "footer.email_placeholder": "Enter your email",
    "footer.subscribe": "Subscribe",
    "footer.copyright": "© 2025 ConstructVN. All rights reserved.",

    // Pricing section
    "pricing.title": "Pricing Plans",
    "pricing.subtitle": "Choose the service package that suits your business needs",
    "pricing.month": "month",
    "pricing.year": "year",
    "pricing.monthly": "Monthly",
    "pricing.yearly": "Yearly",
    "pricing.save_percent": "Save {percent}%",
    "pricing.billing_cycle": "Billing Cycle",
    "pricing.popular": "Popular",
    "pricing.choose_plan": "Choose Plan",

    // Free plan
    "pricing.free.name": "Free",
    "pricing.free.description": "Free trial for individuals",
    "pricing.free.price": "$0",
    "pricing.free.price_yearly": "$0",
    "pricing.free.feature1": "Manage up to 1 project",
    "pricing.free.feature2": "Basic reports",
    "pricing.free.feature3": "1GB storage",

    // Basic plan
    "pricing.basic.name": "Basic",
    "pricing.basic.description": "Perfect for small projects and startups",
    "pricing.basic.price_monthly": "$19",
    "pricing.basic.price_yearly": "$190",
    "pricing.basic.feature1": "Manage up to 5 projects",
    "pricing.basic.feature2": "Basic construction reports",
    "pricing.basic.feature3": "Email support",
    "pricing.basic.feature4": "10GB storage",

    // Professional plan
    "pricing.professional.name": "Professional",
    "pricing.professional.description": "Optimized for small and medium enterprises",
    "pricing.professional.price_monthly": "$39",
    "pricing.professional.price_yearly": "$390",
    "pricing.professional.feature1": "Unlimited project management",
    "pricing.professional.feature2": "Advanced construction reports",
    "pricing.professional.feature3": "Team management and permissions",
    "pricing.professional.feature4": "Phone and email support",
    "pricing.professional.feature5": "100GB storage",

    // Enterprise plan
    "pricing.enterprise.name": "Enterprise",
    "pricing.enterprise.description": "Comprehensive solution for large corporations",
    "pricing.enterprise.price_monthly": "$199",
    "pricing.enterprise.price_yearly": "$1990",
    "pricing.enterprise.feature1": "All Professional features",
    "pricing.enterprise.feature2": "Custom API integration",
    "pricing.enterprise.feature3": "Advanced analytics reports",
    "pricing.enterprise.feature4": "24/7 priority support",
    "pricing.enterprise.feature5": "Unlimited storage",
    "pricing.enterprise.feature6": "Professional training and consulting",

    // Forgot password page
    "forgot_password.title": "Forgot Password",
    "forgot_password.description": "Enter your email address and we'll send you a password reset link",
    "forgot_password.email_label": "Email Address",
    "forgot_password.email_placeholder": "Enter your email",
    "forgot_password.send_reset": "Send Reset Link",
    "forgot_password.sending": "Sending...",
    "forgot_password.back_to_login": "Back to Login",
    "forgot_password.success_title": "Email Sent!",
    "forgot_password.success_description":
      "We've sent a password reset link to your email. Please check your inbox and follow the instructions.",
    "forgot_password.success_back": "Back to Home",
    "forgot_password.errors.email_required": "Please enter your email address",
    "forgot_password.errors.email_invalid": "Invalid email address",

    // Construction Reports page
    "construction_diaries.title": "Construction Reports Management",
    "construction_diaries.subtitle": "Manage construction reports for building projects",
    "construction_diaries.back_home": "Home",
    "construction_diaries.template_title": "Word Report Template",
    "construction_diaries.template_required": "Required",
    "construction_diaries.template_upload": "Upload Word template file (Required)",
    "construction_diaries.template_accept": "Only accept Word files (.docx)",
    "construction_diaries.template_warning": "IMPORTANT NOTE:",
    "construction_diaries.template_note": "The last page of the template file must always be blank",
    "construction_diaries.template_drag": "Drag and drop .docx file here or click to select file",
    "construction_diaries.template_choose": "Choose Word file (Required)",
    "construction_diaries.template_description": "Word template file will be used as template for all reports",
    "construction_diaries.template_last_page": "Ensure last page is blank",

    "construction_diaries.project_groups": "Projects",
    "construction_diaries.create_project_group": "Create",
    "construction_diaries.select_project_group": "Select project to view items",
    "construction_diaries.project_group_name": "Project Name",
    "construction_diaries.project_group_description": "Project Description",
    "construction_diaries.project_group_status": "Status",

    "construction_diaries.constructions": "Items",
    "construction_diaries.create_construction": "Create",
    "construction_diaries.select_construction": "Select item to view packages",
    "construction_diaries.construction_name": "Item Name",
    "construction_diaries.construction_location": "Location",
    "construction_diaries.construction_manager": "Manager",
    "construction_diaries.construction_status": "Status",

    "construction_diaries.description": "Description",
    "construction_diaries.manager": "Manager",
    "construction_diaries.status": "Status",
    "construction_diaries.location": "Location",
    "construction_diaries.update": "Update",
    "construction_diaries.cancel": "Cancel",
    "construction_diaries.status_active": "Active",
    "construction_diaries.status_completed": "Completed",
    "construction_diaries.status_on_hold": "On Hold",
    "construction_diaries.status_in_progress": "In Progress",

    // Projects section (kept for backward compatibility)
    "construction_diaries.projects": "Items",
    "construction_diaries.create_project": "Create",
    "construction_diaries.select_project": "Select item to view packages",
    "construction_diaries.project_name": "Item Name",
    "construction_diaries.project_location": "Location",
    "construction_diaries.project_manager": "Manager",
    "construction_diaries.project_status": "Status",

    // Categories section
    "construction_diaries.categories": "Packages",
    "construction_diaries.create_category": "Create",
    "construction_diaries.select_category": "Select package to view reports",
    "construction_diaries.category_name": "Package Name",
    "construction_diaries.category_description": "Description",

    // Reports section
    "construction_diaries.reports": "Reports",
    "construction_diaries.diaries": "Diaries",
    "construction_diaries.create_report": "Create",
    "construction_diaries.create_diary": "Create",
    "construction_diaries.select_report": "Select category to view reports",
    "construction_diaries.select_diary": "Select category to view diaries",
    "construction_diaries.report_title": "Report Title",
    "construction_diaries.diary_title": "Diary Title",

    // Status options
    "construction_diaries.status.active": "Active",
    "construction_diaries.status.completed": "Completed",
    "construction_diaries.status.paused": "Paused",
    "construction_diaries.status.pending": "Pending",
    "construction_diaries.status.in_progress": "In Progress",
    "construction_diaries.status.draft": "Draft",
    "construction_diaries.status.approved": "Approved",

    // Statistics
    "construction_diaries.stats.total_projects": "Total Items",
    "construction_diaries.stats.total_categories": "Total Packages",
    "construction_diaries.stats.total_reports": "Total Reports",
    "construction_diaries.stats.in_progress": "In Progress",

    // Modal titles
    "construction_diaries.modal.create_project": "Create New Item",
    "construction_diaries.modal.edit_project": "Edit Item",
    "construction_diaries.modal.create_category": "Create New Package",
    "construction_diaries.modal.edit_category": "Edit Package",
    "construction_diaries.modal.create_report": "Create New Report",
    "construction_diaries.modal.create_diary": "Create New Diary",
    "construction_diaries.modal.edit_report": "Edit Report",
    "construction_diaries.modal.edit_diary": "Edit Diary",

    "construction_diaries.modal.create_project_group": "Create New Project",
    "construction_diaries.modal.edit_project_group": "Edit Project",
    "construction_diaries.modal.create_construction": "Create New Item",
    "construction_diaries.modal.edit_construction": "Edit Item",

    // Common actions
    "construction_diaries.actions.cancel": "Cancel",
    "construction_diaries.actions.create": "Create",
    "construction_diaries.actions.update": "Update",
    "construction_diaries.actions.delete": "Delete",
    "construction_diaries.actions.edit": "Edit",

    // Delete confirmations
    "construction_diaries.delete.confirm_title": "Confirm Delete",
    "construction_diaries.delete.project_message": "Are you sure you want to delete this project?",
    "construction_diaries.delete.project_warning":
      "All related categories and reports will be deleted. This action cannot be undone.",
    "construction_diaries.delete.category_message": "Are you sure you want to delete this category?",
    "construction_diaries.delete.category_warning":
      "All related reports will be deleted. This action cannot be undone.",
    "construction_diaries.delete.report_message": "Are you sure you want to delete this report?",
    "construction_diaries.delete.report_warning":
      "The report will be permanently deleted. This action cannot be undone.",
    "construction_diaries.delete.template_message": "Are you sure you want to delete this Word template file?",
    "construction_diaries.delete.template_warning":
      "The template file will be removed from the system. This action cannot be undone.",
    "construction_diaries.confirm_delete_template": "Are you sure you want to delete this Word template file?",
    "construction_diaries.delete_template_warning":
      "The template file will be removed from the system. This action cannot be undone.",

    "construction_diaries.delete.project_group_message": "Are you sure you want to delete this project?",
    "construction_diaries.delete.project_group_warning":
      "All related constructions, categories and reports will be deleted. This action cannot be undone.",
    "construction_diaries.delete.construction_message": "Are you sure you want to delete this construction?",
    "construction_diaries.delete.construction_warning":
      "All related categories and reports will be deleted. This action cannot be undone.",

    "construction_diaries.cancel": "Cancel",
    "construction_diaries.delete": "Delete",
    "construction_diaries.confirm_delete": "Confirm Delete",
    "construction_diaries.confirm_delete_construction": "Are you sure you want to delete this construction?",
    "construction_diaries.delete_construction_warning":
      "All related categories and reports will be deleted. This action cannot be undone.",

    // Report Editor page
    "editor.back": "Back",
    "editor.page": "Page",
    "editor.group": "Group",
    "editor.add_diary": "Add Report",
    "editor.add_diary_desc": "Duplicate pages 7-8 from template file",
    "editor.share_report": "Share Report",
    "editor.lock_unlock": "Lock/Unlock Pages",
    "editor.lock_all": "Lock Pages",
    "editor.unlock_all": "Unlock Pages",
    "editor.page_navigation": "Page Navigation",
    "editor.document_info": "Document Information",
    "editor.total_pages": "Total Pages",
    "editor.locked_pages": "Locked Pages",
    "editor.updated": "Updated",
    "editor.preview": "Preview",
    "editor.save": "Save",
    "editor.print": "Print",
    "editor.loading": "Loading editor...",
    "editor.error_loading": "Error loading editor",
    "editor.construction_images": "Construction Images",
    "editor.image": "Image",
    "editor.page_content": "Page Content",
    "editor.demo_content":
      "This is content from Word template for page {page}. In practice, this content will be taken from the uploaded Word template and displayed with original formatting.",
    "editor.demo_mode": "Demo mode - Need ONLYOFFICE Server for actual editing",
    "editor.auto_save": "Auto Save",
    "editor.onlyoffice_placeholder": "ONLYOFFICE Editor will be displayed here",

    // Share modal
    "editor.share.title": "Share Report",
    "editor.share.email_specific": "Share with specific email",
    "editor.share.email_placeholder": "Enter recipient email",
    "editor.share.add_email": "Add Email",
    "editor.share.shared_with": "Shared with:",
    "editor.share.all_members": "Share with all members",
    "editor.share.cancel": "Cancel",
    "editor.share.share": "Share",
    "editor.share.email_error_required": "Please enter email",
    "editor.share.email_error_invalid": "Invalid email format",
    "editor.share.email_error_exists": "This email has already been added",

    // Lock/Unlock modal
    "editor.lock.title": "Lock Pages",
    "editor.unlock.title": "Unlock Pages",
    "editor.lock.select_all": "Select all pages",
    "editor.lock.select_specific": "Select specific pages:",
    "editor.lock.selected_count": "Selected {count} pages: {pages}",
    "editor.lock.lock_pages": "Lock Pages",
    "editor.unlock.unlock_pages": "Unlock Pages",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("vi")
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("constructvn-language")
    if (saved && (saved === "vi" || saved === "en")) {
      setLanguage(saved as Language)
    }
    setIsHydrated(true)
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("constructvn-language", lang)
  }

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, isHydrated }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
