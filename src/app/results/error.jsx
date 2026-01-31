'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}) {
    useEffect(() => {
        console.error('Results Page Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
                <p className="text-red-400 mb-4">{error.message}</p>
                <button
                    onClick={() => reset()}
                    className="px-4 py-2 bg-primary text-black font-bold rounded hover:bg-primary/80"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
