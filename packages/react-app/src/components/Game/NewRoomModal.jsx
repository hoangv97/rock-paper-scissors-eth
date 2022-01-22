import { useContractReader, useBalance } from "eth-hooks";
import { useState, useEffect } from "react";
import { Modal, Button, Input, Form, Select, notification } from "antd";
import { utils } from "ethers";
import Address from "../Address";
import TokenApproval from "./TokenApproval";

const NewRoom = ({
  tx,
  readContracts,
  writeContracts,
  address,
  localProvider,
  mainnetProvider,
  visible,
  setVisible,
}) => {
  const tokens = useContractReader(readContracts, "GameContract", "getCurrencies");

  const localBalance = useBalance(localProvider, address);
  const mainnetBalance = useBalance(mainnetProvider, address);

  const [confirmLoading, setConfirmLoading] = useState(false);
  const [betAmount, setBetAmount] = useState(0);
  const [selectedToken, setSelectedToken] = useState("");
  const [selectedTokenAddress, setSelectedTokenAddress] = useState("");

  const [tokenBalance, setTokenBalance] = useState(0);

  useEffect(() => {
    const loadToken = async (addressToken) => {
      const _balance = await readContracts.GameToken.attach(addressToken).balanceOf(address);
      setTokenBalance(_balance);
    }

    if (selectedToken === "") {
      setSelectedTokenAddress("");
    } else {
      const newAddressToken = (tokens || []).find(t => t.symbol === selectedToken).addressToken;
      setSelectedTokenAddress(newAddressToken);
      loadToken(newAddressToken);
    }
  }, [tokens, selectedToken, writeContracts]);

  return (
    <>
      <Button type="primary" onClick={() => setVisible(true)}>
        Create Room
      </Button>
      <Modal
        title="Create Room"
        visible={visible}
        onOk={async () => {
          const _betAmount = parseFloat(betAmount);
          if (!_betAmount) {
            notification.error({
              message: "Error",
              description: "Bet amount is invalid!",
            });
            return;
          }
          setConfirmLoading(true);
          let decimals = 18;
          if (selectedToken !== "") {
            // decimals = await readContracts.GameToken.attach(selectedTokenAddress).decimals();
            decimals = 0;
          }
          await tx(
            writeContracts.GameContract.createRoom(selectedToken, {
              value: _betAmount * 10 ** decimals + "",
            }),
          );
          setConfirmLoading(false);
        }}
        confirmLoading={confirmLoading}
        onCancel={() => setVisible(false)}
      >
        <Form labelCol={{ span: 6 }} wrapperCol={{ span: 14 }} layout="horizontal">
          <Form.Item label="Token">
            <Select defaultValue={selectedToken} onChange={(val) => setSelectedToken(val)}>
              <Select.Option value={""}>ETH</Select.Option>
              {tokens &&
                tokens.map(token => (
                  <Select.Option value={token.symbol} key={token.addressToken}>
                    {token.symbol}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          {selectedTokenAddress !== "" && (
            <Form.Item label="Token address">
              <Address value={selectedTokenAddress} fontSize={16} />
            </Form.Item>
          )}
          <Form.Item label="Balance">
            {selectedToken === "" && <div>{utils.formatEther(localBalance)} ETH</div>}
            {selectedToken !== "" && tokenBalance && (
              <>
                <div>
                  {tokenBalance.toNumber()} {selectedToken}
                  <TokenApproval
                    symbol={selectedToken}
                    tx={tx}
                    readContracts={readContracts}
                    writeContracts={writeContracts}
                    amount={betAmount}
                  />
                </div>
              </>
            )}
          </Form.Item>
          <Form.Item label="Bet Amount">
            <Input value={betAmount} onChange={(e) => setBetAmount(e.target.value)} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default NewRoom;