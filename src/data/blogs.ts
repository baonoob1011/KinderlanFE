export interface Blog {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
}

export const blogs: Blog[] = [
  {
    id: '1',
    title: 'Top 10 Đồ Chơi Giúp Phát Triển Trí Tuệ Cho Bé 3-5 Tuổi',
    excerpt: 'Khám phá những món đồ chơi giáo dục tốt nhất giúp bé phát triển tư duy logic và sáng tạo trong độ tuổi mầm non.',
    content: 'Trong giai đoạn từ 3-5 tuổi, trẻ em đang ở thời kỳ vàng phát triển trí tuệ. Việc lựa chọn đồ chơi phù hợp không chỉ giúp bé vui chơi mà còn kích thích sự phát triển toàn diện...',
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800',
    author: 'Nguyễn Thị Lan',
    date: '2025-01-10',
    category: 'Tư vấn',
    readTime: '5 phút',
  },
  {
    id: '2',
    title: 'Cách Chọn Đồ Chơi An Toàn Cho Trẻ Sơ Sinh',
    excerpt: 'Hướng dẫn cha mẹ cách nhận biết và lựa chọn đồ chơi an toàn, phù hợp với độ tuổi của trẻ sơ sinh và trẻ nhỏ.',
    content: 'An toàn luôn là yếu tố hàng đầu khi lựa chọn đồ chơi cho trẻ nhỏ. Cha mẹ cần chú ý đến chất liệu, kích thước và các tiêu chuẩn an toàn...',
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800',
    author: 'Trần Văn Minh',
    date: '2025-01-08',
    category: 'An toàn',
    readTime: '7 phút',
  },
  {
    id: '3',
    title: 'Lợi Ích Của Việc Chơi LEGO Đối Với Sự Phát Triển Của Trẻ',
    excerpt: 'Tìm hiểu về những lợi ích tuyệt vời mà LEGO mang lại cho sự phát triển thể chất và tinh thần của trẻ em.',
    content: 'LEGO không chỉ là đồ chơi xếp hình thông thường. Nó là công cụ giáo dục tuyệt vời giúp trẻ phát triển nhiều kỹ năng quan trọng...',
    image: 'https://images.unsplash.com/photo-1672267273720-053bee27b9a2?w=800',
    author: 'Lê Thị Hương',
    date: '2025-01-05',
    category: 'Giáo dục',
    readTime: '6 phút',
  },
  {
    id: '4',
    title: 'Xu Hướng Đồ Chơi Năm 2025: Những Gì Bố Mẹ Cần Biết',
    excerpt: 'Cập nhật những xu hướng đồ chơi mới nhất trong năm 2025 và cách chúng ảnh hưởng đến sở thích của trẻ em.',
    content: 'Năm 2025 chứng kiến sự phát triển mạnh mẽ của công nghệ trong ngành đồ chơi. Từ robot AI đến đồ chơi thực tế ảo...',
    image: 'https://images.unsplash.com/photo-1546776230-bb86256870ce?w=800',
    author: 'Phạm Văn Nam',
    date: '2025-01-03',
    category: 'Xu hướng',
    readTime: '8 phút',
  },
  {
    id: '5',
    title: 'Tại Sao Trẻ Em Nên Chơi Búp Bê: Phát Triển Cảm Xúc',
    excerpt: 'Vai trò quan trọng của búp bê trong việc phát triển kỹ năng xã hội và cảm xúc của trẻ, đặc biệt là các bé gái.',
    content: 'Chơi búp bê không chỉ đơn thuần là trò chơi giả vờ. Đây là hoạt động quan trọng giúp trẻ học cách thấu hiểu cảm xúc...',
    image: 'https://images.unsplash.com/photo-1612506001235-f0d0892aa11b?w=800',
    author: 'Nguyễn Thị Mai',
    date: '2024-12-28',
    category: 'Phát triển',
    readTime: '5 phút',
  },
  {
    id: '6',
    title: 'Đồ Chơi STEM: Chìa Khóa Cho Tương Lai Của Con',
    excerpt: 'Tìm hiểu về đồ chơi STEM và cách chúng chuẩn bị cho trẻ những kỹ năng cần thiết trong thế kỷ 21.',
    content: 'Giáo dục STEM (Science, Technology, Engineering, Mathematics) đang trở thành xu hướng toàn cầu. Đồ chơi STEM giúp trẻ tiếp cận với khoa học...',
    image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800',
    author: 'Hoàng Văn Tuấn',
    date: '2024-12-25',
    category: 'Giáo dục',
    readTime: '10 phút',
  },
  {
    id: '7',
    title: 'Cách Dọn Dẹp và Bảo Quản Đồ Chơi Đúng Cách',
    excerpt: 'Hướng dẫn chi tiết cách làm sạch, khử trùng và bảo quản đồ chơi để đảm bảo an toàn cho sức khỏe của bé.',
    content: 'Việc vệ sinh và bảo quản đồ chơi đúng cách không chỉ giúp đồ chơi bền lâu mà còn bảo vệ sức khỏe của trẻ...',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    author: 'Đỗ Thị Hà',
    date: '2024-12-20',
    category: 'Hướng dẫn',
    readTime: '6 phút',
  },
  {
    id: '8',
    title: 'Đồ Chơi Ngoài Trời: Khuyến Khích Trẻ Vận Động',
    excerpt: 'Tầm quan trọng của đồ chơi ngoài trời trong việc phát triển thể chất và tinh thần của trẻ em hiện đại.',
    content: 'Trong thời đại công nghệ số, trẻ em ngày càng ít vận động. Đồ chơi ngoài trời là giải pháp tuyệt vời để khuyến khích trẻ hoạt động thể chất...',
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800',
    author: 'Vũ Văn Long',
    date: '2024-12-15',
    category: 'Sức khỏe',
    readTime: '7 phút',
  },
];
