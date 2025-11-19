"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Search, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// Định nghĩa kiểu dữ liệu trả về từ Vietmap Autocomplete
interface Suggestion {
    ref_id: string;
    address: string;
    name: string;
    display: string;
}

interface AddressAutocompleteProps {
    onSelect: (data: {
        street: string;
        ward: string;
        city: string;
        lat: number;
        lng: number;
    }) => void;
    className?: string;
}

export function AddressAutocomplete({ onSelect, className }: AddressAutocompleteProps) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Debounce search: Chỉ gọi API sau khi ngừng gõ 500ms
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 2) {
                fetchSuggestions(query);
            } else {
                setSuggestions([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    // Xử lý click ra ngoài để đóng dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchSuggestions = async (searchText: string) => {
        setIsLoading(true);
        try {
            const apiKey = process.env.NEXT_PUBLIC_VIETMAP_API_KEY || "";
            const url = `https://maps.vietmap.vn/api/autocomplete/v3?apikey=${apiKey}&text=${encodeURIComponent(searchText)}`;

            const res = await fetch(url);
            const data = await res.json();

            if (Array.isArray(data)) {
                setSuggestions(data);
                setIsOpen(true);
            }
        } catch (error) {
            console.error("Autocomplete error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectSuggestion = async (item: Suggestion) => {
        setQuery(item.display); // Hiển thị tên đầy đủ lên ô input
        setIsOpen(false);
        setIsLoading(true);

        try {
            // Gọi API Place v3 để lấy chi tiết tọa độ và các cấp hành chính
            const apiKey = process.env.NEXT_PUBLIC_VIETMAP_API_KEY || "";
            const url = `https://maps.vietmap.vn/api/place/v3?apikey=${apiKey}&refid=${item.ref_id}`;

            const res = await fetch(url);
            const data = await res.json();

            if (data) {
                // Gửi dữ liệu về form cha
                onSelect({
                    street: data.address || data.name || "", // Lấy tên đường/số nhà
                    ward: data.ward || "",
                    city: data.city || "", // Vietmap thường trả về "Thành phố Hồ Chí Minh"
                    lat: data.lat || 0,
                    lng: data.lng || 0,
                });

                toast({
                    title: "Đã chọn địa điểm",
                    description: "Thông tin địa chỉ và tọa độ đã được điền tự động.",
                });
            }
        } catch (error) {
            toast({
                title: "Lỗi lấy chi tiết",
                description: "Không thể lấy thông tin chi tiết địa điểm này.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div ref={wrapperRef} className={cn("relative w-full", className)}>
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Tìm kiếm địa chỉ nhanh (VD: Bến xe Miền Đông)..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    className="pl-9 pr-9"
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => { setQuery(""); setSuggestions([]); }}
                        className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Dropdown Gợi ý */}
            {isOpen && (suggestions.length > 0 || isLoading) && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
                    {isLoading && suggestions.length === 0 && (
                        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tìm kiếm...
                        </div>
                    )}

                    {!isLoading && suggestions.length === 0 && query.length > 2 && (
                        <div className="p-4 text-sm text-muted-foreground text-center">Không tìm thấy kết quả</div>
                    )}

                    {suggestions.map((item) => (
                        <button
                            key={item.ref_id}
                            type="button"
                            onClick={() => handleSelectSuggestion(item)}
                            className="flex w-full flex-col items-start px-4 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                        >
                            <span className="font-medium flex items-center">
                                <MapPin className="mr-2 h-3.5 w-3.5 text-primary" />
                                {item.name}
                            </span>
                            <span className="ml-5 text-xs text-muted-foreground truncate w-[90%]">
                                {item.display}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}