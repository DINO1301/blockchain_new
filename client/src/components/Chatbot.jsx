import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: 'Chào bạn! Tôi là trợ lý ảo MediBot. Bạn có thể nhập triệu chứng như "tôi đang bị...." hoặc tên thuốc cụ thể để tôi hỗ trợ tư vấn loại thuốc phù hợp nhé!' }
  ]);
  const [input, setInput] = useState('');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSuggestions, setLastSuggestions] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*');
        
        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu thuốc cho Chatbot:", error);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    setTimeout(() => {
      processBotResponse(userMessage);
    }, 800);
  };

  const processBotResponse = (query) => {
    const lowerQuery = query.toLowerCase().trim();
    
    // 0. Xử lý các câu chào hỏi trước (để tránh Bot đi tìm kiếm thuốc cho từ "hi", "chào")
    const greetings = ["hi", "hello", "chào", "xin chào", "hey", "alo"];
    if (greetings.includes(lowerQuery)) {
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        type: 'bot', 
        text: "Chào bạn! Rất vui được hỗ trợ. Bạn hãy mô tả triệu chứng hoặc nhập tên thuốc cần tìm để tôi tư vấn nhé." 
      }]);
      setIsLoading(false);
      return;
    }

    // 1. Logic So sánh & Phân tích chi tiết (nếu đã có gợi ý trước đó)
    const isComparisonRequest = lowerQuery.includes("nào tốt hơn") || 
                               lowerQuery.includes("nào phù hợp hơn") || 
                               lowerQuery.includes("khác nhau") ||
                               lowerQuery.includes("trẻ em") || 
                               lowerQuery.includes("người lớn") ||
                               lowerQuery.includes("bé") ||
                               lowerQuery.includes("nhỏ") ||
                               lowerQuery.includes("công dụng") ||
                               (lowerQuery.includes("cái này") && lastSuggestions.length > 0);

    if (isComparisonRequest && lastSuggestions.length > 0) {
      const isKidSearch = lowerQuery.includes("trẻ em") || lowerQuery.includes("bé") || lowerQuery.includes("nhỏ");
      const isAdultSearch = lowerQuery.includes("người lớn") || lowerQuery.includes("lớn");

      let comparisonResponse = isKidSearch ? "Đây là các loại thuốc dành cho trẻ nhỏ trong số các gợi ý vừa rồi:\n\n" : "Dưới đây là phân tích chi tiết để bạn chọn loại phù hợp nhất:\n\n";
      
      let foundTarget = false;
      lastSuggestions.forEach((p, index) => {
        const name = p.name || "";
        const uses = p.uses || "";
        const desc = p.description || "";
        
        const isForKids = uses.toLowerCase().includes("trẻ em") || uses.toLowerCase().includes("bé") || desc.toLowerCase().includes("trẻ em") || name.toLowerCase().includes("bebe") || name.toLowerCase().includes("kid");
        
        if (isKidSearch && !isForKids) return; // Nếu đang tìm cho trẻ em mà thuốc này không phải thì bỏ qua
        if (isAdultSearch && isForKids && !uses.toLowerCase().includes("người lớn")) return;

        foundTarget = true;
        const targetText = isForKids ? "Trẻ em" : "Người lớn/Cả hai";

        comparisonResponse += `🔹 ${name} (${targetText}):\n`;
        comparisonResponse += `   - Công dụng: ${uses}\n\n`;
      });

      if (!foundTarget) {
        comparisonResponse = isKidSearch ? "Xin lỗi, trong số các thuốc vừa tìm thấy, tôi chưa thấy loại nào ghi rõ dành cho trẻ nhỏ. Bạn nên hỏi ý kiến bác sĩ trước khi cho bé dùng nhé." : "Tôi chưa tìm thấy thông tin phân loại cụ thể cho yêu cầu này.";
      }

      setMessages(prev => [...prev, { 
        id: Date.now(), type: 'bot', text: comparisonResponse, suggestions: lastSuggestions 
      }]);
      setIsLoading(false);
      return;
    }

    // 2. Logic Tìm kiếm từ khóa cải tiến
    const stopWords = ["tôi", "đang", "bị", "các", "bệnh", "muốn", "tìm", "loại", "thuốc", "có", "không", "cho", "hỏi", "giúp", "với"];
    const keywords = lowerQuery.split(/\s+/).filter(word => word.length > 2 && !stopWords.includes(word));

    const matchedProducts = products.map(p => {
      let score = 0;
      const name = (p.name || "").toLowerCase();
      const uses = (p.uses || "").toLowerCase();
      const ingredients = (p.ingredients || "").toLowerCase();
      
      // A. Khớp cả cụm từ triệu chứng (Ưu tiên cao nhất)
      // Ví dụ: "đau đầu", "đau họng", "ngứa da"
      const symptomPhrases = [
        "đau đầu", "nhức đầu", "đau họng", "viêm họng", "đau bụng", 
        "đau răng", "đau lưng", "viêm mũi", "ngứa ngoài da", "dị ứng"
      ];
      symptomPhrases.forEach(phrase => {
        if (lowerQuery.includes(phrase)) {
          if (uses.includes(phrase) || uses.includes(phrase.replace(" ", ""))) score += 20; 
          else if (name.includes(phrase)) score += 15;
        }
      });

      // B. Khớp từng từ khóa riêng lẻ
      keywords.forEach(kw => {
        if (uses.includes(kw)) score += 5; // Tăng điểm khớp từ đơn
        if (name.includes(kw)) score += 8; 
        if (ingredients.includes(kw)) score += 3;
      });

      // C. Xử lý trường hợp "đau/viêm" nhưng không đúng bộ phận (Hình phạt nặng để tránh nhầm lẫn)
      if (lowerQuery.includes("đầu") && !uses.includes("đầu") && !uses.includes("nhức") && !name.includes("đầu")) {
        score = Math.max(0, score - 25); 
      }
      if (lowerQuery.includes("họng") && !uses.includes("họng") && !name.includes("họng")) {
        score = Math.max(0, score - 25);
      }
      if (lowerQuery.includes("mũi") && !uses.includes("mũi") && !name.includes("mũi")) {
        score = Math.max(0, score - 25);
      }
      if (lowerQuery.includes("da") && !uses.includes("da") && !name.includes("da")) {
        score = Math.max(0, score - 25);
      }

      return { ...p, score };
    })
    .filter(p => p.score > 2) // Giảm ngưỡng điểm tối thiểu từ 5 xuống 2
    .sort((a, b) => b.score - a.score);

    let response = "";
    let suggestedProducts = [];

    if (matchedProducts.length > 0) {
      const topMatch = matchedProducts[0];
      if (topMatch.name.toLowerCase() === lowerQuery || topMatch.score >= 5) {
        response = `Tôi đã tìm thấy sản phẩm "${topMatch.name}" phù hợp với yêu cầu của bạn:`;
      } else {
        response = `Dựa trên triệu chứng bạn mô tả, tôi tìm thấy ${matchedProducts.length} sản phẩm có thể hỗ trợ bạn:`;
      }
      suggestedProducts = matchedProducts.slice(0, 3);
      setLastSuggestions(suggestedProducts);
    } else {
      if (lowerQuery.includes("chào") || lowerQuery.includes("hi") || lowerQuery.includes("hello")) {
        response = "Chào bạn! Rất vui được hỗ trợ. Bạn hãy mô tả triệu chứng (ví dụ: 'đau đầu', 'ngứa ngoài da'...) hoặc tên thuốc bạn cần tìm nhé.";
      } else if (lowerQuery.includes("cảm ơn") || lowerQuery.includes("thanks")) {
        response = "Không có gì! Chúc bạn luôn mạnh khỏe. Nếu cần gì thêm cứ hỏi tôi nhé.";
      } else {
        response = "Xin lỗi, tôi chưa tìm thấy loại thuốc nào khớp với mô tả của bạn. Bạn có thể thử nhập từ khóa ngắn gọn hơn (ví dụ: 'ngứa', 'viêm mũi', 'canxi'...) hoặc liên hệ bác sĩ để được tư vấn chính xác nhất.";
      }
    }

    setMessages(prev => [...prev, { 
      id: Date.now(), type: 'bot', text: response, suggestions: suggestedProducts 
    }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all active:scale-95 flex items-center justify-center group relative"
        >
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
          <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {isOpen && (
        <div className="bg-white w-[350px] sm:w-[400px] h-[550px] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-gradient-to-r from-primary to-blue-600 p-5 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Bot size={24} />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider">MediBot AI</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold opacity-80">Đang trực tuyến</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex gap-2 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.type === 'bot' ? 'bg-blue-100 text-primary' : 'bg-primary text-white'}`}>
                    {msg.type === 'bot' ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  <div className="space-y-3">
                    <div className={`p-4 rounded-2xl text-sm shadow-sm leading-relaxed whitespace-pre-line ${
                      msg.type === 'bot' ? 'bg-white text-gray-700 border border-gray-100 rounded-tl-none' : 'bg-primary text-white rounded-tr-none'
                    }`}>
                      {msg.text}
                    </div>
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="grid gap-2">
                        {msg.suggestions.map(prod => (
                          <Link to={`/product/${prod.id}`} key={prod.id} onClick={() => setIsOpen(false)} className="bg-white p-3 rounded-xl border border-gray-200 hover:border-primary hover:shadow-md transition-all flex items-center gap-3 group">
                            <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                               <img src={prod.image_url} alt={prod.name} className="w-full h-full object-contain" />
                            </div>
                            <div className="min-w-0 flex-1">
                               <p className="text-xs font-bold text-gray-800 truncate">{prod.name}</p>
                               <p className="text-[10px] text-primary font-black uppercase tracking-tighter">Xem chi tiết</p>
                            </div>
                            <ChevronRight size={14} className="text-gray-300 group-hover:text-primary transition-colors" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-in fade-in">
                <div className="flex gap-2 items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                  <Loader2 size={16} className="animate-spin text-primary" />
                  <span className="text-xs font-bold text-gray-400">MediBot đang suy nghĩ...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-gray-100">
            <form onSubmit={handleSend} className="relative flex items-center gap-2">
              <input
                type="text"
                placeholder="Ví dụ: 'đau đầu', 'canxi'..."
                className="flex-1 bg-gray-50 border-none rounded-2xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button type="submit" disabled={!input.trim() || isLoading} className="absolute right-1.5 w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all active:scale-90 disabled:opacity-50 shadow-lg shadow-primary/20">
                <Send size={18} />
              </button>
            </form>
            <div className="mt-3 flex items-center justify-center gap-2">
               <Sparkles size={12} className="text-amber-400" />
               <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Hỗ trợ tư vấn dược phẩm 24/7</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
