
"use client"
import React from "react";
import { useRouter, usePathname } from "next/navigation";


const Statements = () => {

    const pathname = usePathname();

    return (
        <div>
            <h1>Statements works!</h1>
            <p>Current pathname: {pathname}</p>
        </div>
    );  
}

export default Statements;
    