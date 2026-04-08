import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
  
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_GEN_AI_KEY);
  const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });

  useEffect(() => {
    handleSend();
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const input = "Xin chào!";
    try {
      const result = await model.generateContent(input);
      const response = await result.response;
      const text = response.text();

      // Cập nhật phản hồi từ Gemini
      console.log(text);
      
    } catch (error) {
      console.error("Lỗi khi gọi Gemini API:", error);
      // setHistory([...newHistory, { role: "bot", text: "Có lỗi xảy ra, thử lại sau nhé!" }]);
    } finally {
      setIsLoading(false);
    }
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
