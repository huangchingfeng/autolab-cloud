import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadCardProps {
  title: string;
  description: string;
  downloadUrl: string;
  buttonText?: string;
}

export function DownloadCard({
  title,
  description,
  downloadUrl,
  buttonText = "免費下載簡報",
}: DownloadCardProps) {
  return (
    <div className="my-8 rounded-2xl bg-amber-50/80 border border-amber-100 p-6 md:p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Orange document icon */}
        <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg">
          <FileText className="w-10 h-10 md:w-12 md:h-12 text-white" strokeWidth={1.5} />
        </div>
        
        {/* Content */}
        <div className="flex-1 space-y-3">
          <h3 className="text-xl md:text-2xl font-bold text-gray-800">
            {title}
          </h3>
          <p className="text-gray-600 text-base md:text-lg leading-relaxed">
            {description}
          </p>
          
          {/* Download button with gradient */}
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
          >
            <Button
              className="mt-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 h-auto text-base font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <Download className="w-5 h-5 mr-2" />
              {buttonText}
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
