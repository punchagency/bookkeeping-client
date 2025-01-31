
"use client"
import React from "react";
import { useRouter, usePathname } from "next/navigation";


const ConnectBank = () => {

    const pathname = usePathname();

    return (
        <div>
            <h1>ConnectBank works!</h1>
            <p>Current pathname: {pathname}</p>
        </div>
    );  
}

export default ConnectBank;
    