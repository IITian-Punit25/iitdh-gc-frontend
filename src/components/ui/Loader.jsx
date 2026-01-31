import { Loader2 } from 'lucide-react';

export default function Loader() {
    return (
        <div className="flex items-center justify-center min-h-[50vh] w-full">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
}
