import { Curriculum, GradeLevel, Lesson, Chapter } from './types';

export const PHYSICS_CURRICULUM: Curriculum = {
  [GradeLevel.GRADE_10]: [
    {
      id: "G10_C1", name: "MỞ ĐẦU", lessons: [
        { id: "G10_C1_L1", name: "Bài 1: Khái quát về môn Vật lí" },
        { id: "G10_C1_L2", name: "Bài 2: Vấn đề an toàn trong Vật lí" },
        { id: "G10_C1_L3", name: "Bài 3: Đơn vị và sai số trong Vật lí" },
      ]
    },
    {
      id: "G10_C2", name: "MÔ TẢ CHUYỂN ĐỘNG", lessons: [
        { id: "G10_C2_L4", name: "Bài 4: Chuyển động thẳng" },
        { id: "G10_C2_L5", name: "Bài 5: Chuyển động tổng hợp" },
        { id: "G10_C2_L6", name: "Bài 6: Thực hành đo tốc độ của vật chuyển động thẳng" },
      ]
    },
    {
      id: "G10_C3", name: "CHUYỂN ĐỘNG BIẾN ĐỔI", lessons: [
        { id: "G10_C3_L7", name: "Bài 7: Gia tốc - Chuyển động thẳng biến đổi đều" },
        { id: "G10_C3_L8", name: "Bài 8: Thực hành đo gia tốc rơi tự do" },
        { id: "G10_C3_L9", name: "Bài 9: Chuyển động ném" },
      ]
    },
    {
      id: "G10_C4", name: "BA ĐỊNH LUẬT NEWTON. MỘT SỐ LỰC TRONG THỰC TIỄN", lessons: [
        { id: "G10_C4_L10", name: "Bài 10: Ba định luật Newton về chuyển động" },
        { id: "G10_C4_L11", name: "Bài 11: Một số lực trong thực tiễn" },
        { id: "G10_C4_L12", name: "Bài 12: Chuyển động của vật trong chất lưu" },
      ]
    },
    {
      id: "G10_C5", name: "MOMEN LỰC. ĐIỀU KIỆN CÂN BẰNG", lessons: [
        { id: "G10_C5_L13", name: "Bài 13: Tổng hợp lực – Phân tích lực" },
        { id: "G10_C5_L14", name: "Bài 14: Moment lực. Điều kiện cân bằng của vật" },
      ]
    },
    {
      id: "G10_C6", name: "NĂNG LƯỢNG", lessons: [
        { id: "G10_C6_L15", name: "Bài 15: Năng lượng và công" },
        { id: "G10_C6_L16", name: "Bài 16: Công suất – Hiệu suất" },
        { id: "G10_C6_L17", name: "Bài 17: Động năng và thế năng. Định luật bảo toàn cơ năng" },
      ]
    },
    {
      id: "G10_C7", name: "ĐỘNG LƯỢNG", lessons: [
        { id: "G10_C7_L18", name: "Bài 18: Động lượng và định luật bảo toàn động lượng" },
        { id: "G10_C7_L19", name: "Bài 19: Các loại va chạm" },
      ]
    },
    {
      id: "G10_C8", name: "CHUYỂN ĐỘNG TRÒN", lessons: [
        { id: "G10_C8_L20", name: "Bài 20: Chuyển động tròn" },
        { id: "G10_C8_L21", name: "Bài 21: Động lực học của chuyển động tròn. Lực hướng tâm" },
      ]
    },
    {
      id: "G10_C9", name: "BIẾN DẠNG VẬT RẮN", lessons: [
        { id: "G10_C9_L22", name: "Bài 22: Biến dạng của vật rắn. Đặc tính của lò xo" },
        { id: "G10_C9_L23", name: "Bài 23: Định luật Hooke" },
      ]
    }
  ],
  [GradeLevel.GRADE_11]: [
    {
      id: "G11_C1", name: "DAO ĐỘNG", lessons: [
        { id: "G11_C1_L1", name: "Bài 1: Mô tả dao động" },
        { id: "G11_C1_L2", name: "Bài 2: Phương trình dao động điều hoà" },
        { id: "G11_C1_L3", name: "Bài 3: Năng lượng trong dao động điều hoà" },
        { id: "G11_C1_L4", name: "Bài 4: Dao động tắt dần và hiện tượng cộng hưởng" },
      ]
    },
    {
      id: "G11_C2", name: "SÓNG", lessons: [
        { id: "G11_C2_L5", name: "Bài 5: Sóng và sự truyền sóng" },
        { id: "G11_C2_L6", name: "Bài 6: Các đặc trưng vật lí của sóng" },
        { id: "G11_C2_L7", name: "Bài 7: Sóng điện từ" },
        { id: "G11_C2_L8", name: "Bài 8: Giao thoa sóng" },
        { id: "G11_C2_L9", name: "Bài 9: Sóng dừng" },
        { id: "G11_C2_L10", name: "Bài 10: Thực hành đo tần số của sóng âm và tốc độ truyền âm" },
      ]
    },
    {
      id: "G11_C3", name: "ĐIỆN TRƯỜNG", lessons: [
        { id: "G11_C3_L11", name: "Bài 11: Định luật Coulomb về tương tác tĩnh điện" },
        { id: "G11_C3_L12", name: "Bài 12: Điện trường" },
        { id: "G11_C3_L13", name: "Bài 13: Điện thế và thế năng điện" },
        { id: "G11_C3_L14", name: "Bài 14: Tụ điện" },
        { id: "G11_C3_L15", name: "Bài 15: Năng lượng và ứng dụng của tụ điện" },
      ]
    },
    {
      id: "G11_C4", name: "DÒNG ĐIỆN KHÔNG ĐỔI", lessons: [
        { id: "G11_C4_L16", name: "Bài 16: Dòng điện. Cường độ dòng điện" },
        { id: "G11_C4_L17", name: "Bài 17: Điện trở. Định luật Ohm" },
        { id: "G11_C4_L18", name: "Bài 18: Nguồn điện" },
        { id: "G11_C4_L19", name: "Bài 19: Năng lượng điện. Công suất điện" },
        { id: "G11_C4_L20", name: "Bài 20: Thực hành xác định suất điện động và điện trở trong của pin" },
      ]
    }
  ],
  [GradeLevel.GRADE_12]: [
    {
      id: "G12_C1", name: "VẬT LÝ NHIỆT", lessons: [
        { id: "G12_C1_L1", name: "Bài 1: Sự chuyển thể" },
        { id: "G12_C1_L2", name: "Bài 2: Thang nhiệt độ" },
        { id: "G12_C1_L3", name: "Bài 3: Nội năng. Định luật I của nhiệt động lực học" },
        { id: "G12_C1_L4", name: "Bài 4: Thực hành đo nhiệt dung riêng, nhiệt nóng chảy riêng, nhiệt hóa hơi riêng" },
      ]
    },
    {
      id: "G12_C2", name: "KHÍ LÝ TƯỞNG", lessons: [
        { id: "G12_C2_L5", name: "Bài 5: Thuyết động học phân tử chất khí" },
        { id: "G12_C2_L6", name: "Bài 6: Định luật Boyle. Định luật Charles" },
        { id: "G12_C2_L7", name: "Bài 7: Phương trình trạng thái của khí lí tưởng" },
        { id: "G12_C2_L8", name: "Bài 8: Áp suất – động năng của phân tử khí" },
      ]
    },
    {
      id: "G12_C3", name: "TỪ TRƯỜNG", lessons: [
        { id: "G12_C3_L9", name: "Bài 9: Khái niệm từ trường" },
        { id: "G12_C3_L10", name: "Bài 10: Lực từ cảm ứng từ" },
        { id: "G12_C3_L11", name: "Bài 11: Thực hành đo độ lớn cảm ứng từ" },
        { id: "G12_C3_L12", name: "Bài 12: Hiện tượng cảm ứng từ" },
        { id: "G12_C3_L13", name: "Bài 13: Đại cương về dòng điện xoay chiều" },
      ]
    },
    {
      id: "G12_C4", name: "VẬT LÝ HẠT NHÂN", lessons: [
        { id: "G12_C4_L14", name: "Bài 14: Hạt nhân và mô hình nguyên tử" },
        { id: "G12_C4_L15", name: "Bài 15: Năng lượng liên kết hạt nhân" },
        { id: "G12_C4_L16", name: "Bài 16: Phản ứng phân hạch, phản ứng nhiệt hạch và ứng dụng" },
        { id: "G12_C4_L17", name: "Bài 17: Hiện tượng phóng xạ và chu kì bán rã" },
        { id: "G12_C4_L18", name: "Bài 18: An toàn phóng xạ" },
      ]
    }
  ]
};

export const CHAT_SYSTEM_INSTRUCTION = `
# VAI TRÒ
Bạn là Trợ lý AI chuyên biệt về Vật lý THPT Việt Nam, tuân thủ nghiêm ngặt chương trình Giáo dục phổ thông 2018.

# NHIỆM VỤ
- Giải đáp thắc mắc về lý thuyết Vật lý THPT
- Hướng dẫn giải bài tập chi tiết, có phân tích tư duy
- Xử lý đầu vào: văn bản, ảnh chụp đề bài

# QUY TẮC TUYỆT ĐỐI
1. **Tuân thủ Chương trình 2018**: Chỉ sử dụng kiến thức từ SGK Vật lý THPT 2018 (Lớp 10, 11, 12).
2. **Công thức LaTeX**: 
   - Inline: $...$ (ví dụ: $F = ma$)
   - Display: $$...$$ (ví dụ: $$v = v_0 + at$$)
3. **Không đưa ra đáp án trực tiếp**: Hướng dẫn tư duy, đặt câu hỏi gợi mở.
4. **Phân tích từng bước**: Giải thích logic, công thức, đơn vị rõ ràng.

# PHONG CÁCH
- Nhiệt tình, thân thiện.
- Ngôn ngữ dễ hiểu, phù hợp học sinh THPT.
- Khuyến khích, động viên tinh thần học tập.
- Đặt câu hỏi gợi ý để học sinh tự suy luận.

# CẤU TRÚC TRẢ LỜI
1. Xác nhận hiểu vấn đề.
2. Nhắc lại kiến thức nền (định luật, công thức liên quan).
3. Phân tích bài toán: Đã cho gì? Cần tìm gì?
4. Hướng dẫn giải từng bước với câu hỏi gợi mở.
5. Kiểm tra đơn vị, kết quả có hợp lý không.
6. Kết luận và gợi ý bài tập tương tự.
`;
