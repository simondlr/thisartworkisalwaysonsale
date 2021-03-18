import React from 'react'
import Blockies from 'react-blockies';
import { Typography, Skeleton } from 'antd';
const { Text } = Typography;

export default function Address(props) {

  if(!props.value){
    return (
      <span>
        <Skeleton avatar paragraph={{ rows: 1 }} />
      </span>
    )
  }

  let displayAddress = props.value.substr(0,10)

  let blockExplorer = "https://etherscan.io/address/"
  if(props.blockExplorer){
    blockExplorer = props.blockExplorer
  }

  let text

  text = (
    <Text >
      <a href={blockExplorer+props.value}>[{displayAddress}] </a>
    </Text>
  )

  return (
    <span>
        {text}
    </span>
  );
}
