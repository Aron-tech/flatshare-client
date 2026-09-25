import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react-native";
import { View } from "react-native";

/** Lekerekített keresőmező nagyító ikonnal. */
export function SearchField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View className="justify-center">
      <View className="absolute left-4 z-10">
        <Icon as={Search} size={18} className="text-muted-foreground" />
      </View>
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        className="rounded-full pl-11"
        returnKeyType="search"
      />
    </View>
  );
}
