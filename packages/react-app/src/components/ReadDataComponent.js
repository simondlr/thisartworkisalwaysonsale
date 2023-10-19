import React from "react";
import { useContractReads  } from 'wagmi';
import ArtStewardJSON from "./contracts/ArtSteward.json";

/*
Used to test contract reads during development
*/
function ReadDataComponent(props) {
  const {data, isSuccess } = useContractReads({
    contracts: [
      {
        address: '0xa5a7123caaaa8bec0d8b7ffbb0eeb78e73d5b76f',
        abi: ArtStewardJSON.abi,
        functionName: 'price',
      },
      {
        address: '0xa5a7123caaaa8bec0d8b7ffbb0eeb78e73d5b76f',
        abi: ArtStewardJSON.abi,
        functionName: 'deposit',
      },
    ]
  });

  console.log('reading data');
  console.log(data);

  return (
    <div>see console log</div>
  );
}

export {ReadDataComponent};