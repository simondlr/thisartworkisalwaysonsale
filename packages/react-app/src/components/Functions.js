import React from "react";
import { Form, Input, InputNumber, Button } from 'antd';

import ArtStewardJSON from "./contracts/ArtSteward.json";

import { useWaitForTransaction, useContractWrite  } from 'wagmi';
import { parseEther } from 'viem';
import { useState } from 'react';

import { useDebounce } from 'use-debounce';

/*
NOTE: Debouncing not needed since not using async prepared writes.
BUT: keeping it in, in case it's desired for the future.
async prepared writes are not needed since interactions with the dapp is low (both in gas estimation time and amount of interactions)
*/

function BuyForm(props) {
  const [salePrice, setSalePrice] = useState(parseEther('1'));
  const [debouncedSalePrice] = useDebounce(salePrice, 500);
  const [deposit, setDeposit] = useState('1');
  const [debouncedDeposit] = useDebounce(deposit, 500);
  const [form] = Form.useForm();

  const { data, write } = useContractWrite({
    address: props.stewardAddress,
    abi: ArtStewardJSON.abi,
    functionName: 'buy',
    args: [debouncedSalePrice ? parseEther(debouncedSalePrice.toString()) : parseEther('0'), props.artPriceETH],
    value: props.artPriceETH + (debouncedDeposit ? parseEther(debouncedDeposit.toString()) : parseEther('0'))
  });

  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  return (
    <div>
    <Form layout="vertical" size="small" form={form} name="control-hooks" onFinish={write}
      initialValues={{v: props.v}}
    >
      <Form.Item noStyle name="v" >
        <Input type='hidden'/>
      </Form.Item>

      <Form.Item noStyle name="artPriceETH" >
        <Input type='hidden'/>
      </Form.Item>

      <Form.Item label="New Sale Price" rules={[{required: true}]}> 
      <Form.Item name= "newSalePrice" noStyle rules={[
          { required: true,  message: "ETH Price Required!"}
          ]}>
        <InputNumber onChange={(e) => setSalePrice(e)} /> 
      </Form.Item> <span>ETH</span>
      </Form.Item>

      <Form.Item label="Initial Deposit" rules={[{ required: true }]}>
      <Form.Item name="deposit" noStyle rules={[
          { required: true,  message: "Deposit Required!"}
          ]}>
        <InputNumber onChange={(e) => setDeposit(e)}  /> 
      </Form.Item> <span>ETH</span>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" disabled={isLoading}>
          Buy Artwork 
        </Button>
        {isLoading ? ' Transaction Pending...': ''}
        {isSuccess ? ' Completed! Refresh data if needed.' : ''}
      </Form.Item>
    </Form>

    </div>
  );
}

function ChangePriceForm(props) {
  const [changePriceForm] = Form.useForm();
  const [newPrice, setNewPrice] = useState('');
  const [debouncedNewPrice] = useDebounce(newPrice, 500);

  const { data, write } = useContractWrite({
    address: props.stewardAddress,
    abi: ArtStewardJSON.abi,
    functionName: 'changePrice',
    args: [debouncedNewPrice ? parseEther(debouncedNewPrice.toString()) : parseEther('0')],
  });
 
  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  return (
    <Form layout="inline" size="small" form={changePriceForm} name="control-hooks" onFinish={write}
    initialValues={{v: props.v}}
  >
    {/* Change Price*/}
    <Form.Item noStyle name="v" >
      <Input type='hidden'/>
    </Form.Item>
    <Form.Item label="" rules={[{required: true}]}> 
    <Form.Item name= "newPrice" noStyle rules={[
        { required: true,  message: "New Price Required!"}
        ]}>
      <InputNumber onChange={(e) => setNewPrice(e)} /> 
    </Form.Item> <span>ETH</span>
    </Form.Item>
    <Form.Item>
      <Button type="primary" htmlType="submit">
      Change Price 
      </Button>
      {isLoading ? ' Transaction Pending...': ''}
      {isSuccess ? ' Completed! Refresh data if needed.' : ''}
    </Form.Item>
  </Form>
  );
}

function TopupDepositForm(props) {
  const [topupDepositForm] = Form.useForm();
  const [extraDeposit, setExtraDeposit] = useState('');
  const [debouncedExtraDeposit] = useDebounce(extraDeposit, 500);

  const { data, write } = useContractWrite({
    address: props.stewardAddress,
    abi: ArtStewardJSON.abi,
    functionName: 'depositWei',
    value: debouncedExtraDeposit ? parseEther(debouncedExtraDeposit.toString()) : parseEther('0'),
  });
 
  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  return (
    <Form layout="inline" size="small" form={topupDepositForm} name="control-hooks" onFinish={write}
    initialValues={{v: props.v}}
  >
    <Form.Item noStyle name="v" >
      <Input type='hidden'/>
    </Form.Item>
    <Form.Item label="" rules={[{required: true}]}> 
    <Form.Item name= "topupDeposit" noStyle rules={[
        { required: true,  message: "Additional Deposit Required!"}
        ]}>
      <InputNumber onChange={(e) => setExtraDeposit(e)} /> 
    </Form.Item> <span>ETH</span>
    </Form.Item>
    <Form.Item>
      <Button type="primary" htmlType="submit">
        Top Up ETH To Deposit
      </Button>
      {isLoading ? ' Transaction Pending...': ''}
      {isSuccess ? ' Completed! Refresh data if needed.' : ''}
    </Form.Item>
    </Form>
  )
}

function WithdrawSomeDepositForm(props) {
  const [withdrawSomeDepositForm] = Form.useForm();
  const [someDeposit, setSomeDeposit] = useState('');
  const [debouncedSomeDeposit] = useDebounce(someDeposit, 500);

  const { data, write } = useContractWrite({
    address: props.stewardAddress,
    abi: ArtStewardJSON.abi,
    functionName: 'withdrawDeposit',
    args: [debouncedSomeDeposit ? parseEther(debouncedSomeDeposit.toString()) : parseEther('0')],
  });
 
  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  return (
    <Form layout="inline" size="small" form={withdrawSomeDepositForm} name="control-hooks" onFinish={write}
    initialValues={{v: props.v}}
  >
    <Form.Item noStyle name="v" >
      <Input type='hidden'/>
    </Form.Item>
    <Form.Item label="" rules={[{required: true}]}> 
    <Form.Item name= "withdrawSomeDeposit" noStyle rules={[
        { required: true,  message: "Amount Required!"}
        ]}>
      <InputNumber onChange={(e) => setSomeDeposit(e)}  /> 
    </Form.Item> <span>ETH</span>
    </Form.Item>
    <Form.Item>
      <Button type="primary" htmlType="submit">
        Withdraw Some Deposit
      </Button>
      {isLoading ? ' Transaction Pending...': ''}
      {isSuccess ? ' Completed! Refresh data if needed.' : ''}
    </Form.Item>
  </Form>
  )
}

// a bit overkill, but fine for now
// could also refactor all these forms into a generic version
function WithdrawWholeDepositForm(props) {
  const [withdrawWholeDepositForm] = Form.useForm();

  const { data, write } = useContractWrite({
    address: props.stewardAddress,
    abi: ArtStewardJSON.abi,
    functionName: 'exit',
  });
 
  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  return (
    <Form layout="inline" size="small" form={withdrawWholeDepositForm} name="control-hooks" onFinish={write}
    initialValues={{v: props.v}}
    >
      <Form.Item noStyle name="v" >
        <Input type='hidden'/>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Withdraw Entire Deposit And Foreclose
        </Button>
        {isLoading ? ' Transaction Pending...': ''}
        {isSuccess ? ' Completed! Refresh data if needed.' : ''}
      </Form.Item>
    </Form>
  )
}

function CollectPatronageForm(props) {
  const [collectPatronageForm] = Form.useForm();

  const { data, write } = useContractWrite({
    address: props.stewardAddress,
    abi: ArtStewardJSON.abi,
    functionName: '_collectPatronage',
  });
 
  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  return (
    <Form layout="inline" size="small" form={collectPatronageForm} name="control-hooks" onFinish={write}
    initialValues={{v: props.v}}
    >
      <Form.Item noStyle name="v" >
        <Input type='hidden'/>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Collect Patronage
        </Button>
        {isLoading ? ' Transaction Pending...': ''}
        {isSuccess ? ' Completed! Refresh data if needed.' : ''}
      </Form.Item>
    </Form>
  )
}

function ActionForms(props) {
    return (
      <div>
        {/* Change Price*/}
        <ChangePriceForm stewardAddress={props.stewardAddress} />
        <br />
        {/* Top up Deposit*/}
        <TopupDepositForm stewardAddress={props.stewardAddress} />
        <br />
        {/*Withdraw Some Deposit*/}
        <WithdrawSomeDepositForm stewardAddress={props.stewardAddress} />
        <br />
        {/*Withdraw Whole Deposit*/}
        <WithdrawWholeDepositForm stewardAddress={props.stewardAddress} />
        <br />
      </div>
    );
}

export {CollectPatronageForm};
export {BuyForm};
export {ActionForms};