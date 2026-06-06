import dynamic from "next/dynamic";
import ImageUploader from "@/components/ui/ImageUploader";

export default dynamic(() => Promise.resolve(ImageUploader), { ssr: false });
