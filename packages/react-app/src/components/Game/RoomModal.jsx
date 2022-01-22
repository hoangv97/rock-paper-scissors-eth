import { Modal, Input, Form, Row, Col, Button } from "antd";
import { useContractReader } from "eth-hooks";
import { useEffect, useState } from "react";
import { utils, constants } from "ethers";
import Address from "../Address";
import { PLAYER_OPTIONS, ROOM_RESULT, ROOM_STATUS, ROOM_STEP } from "../../helpers/consts";
import { sha256 } from "../../helpers/utils";
import TokenApproval from "./TokenApproval";

const Room = ({ visible, setVisible, id, tx, readContracts, writeContracts, address }) => {

  const [secret, setSecret] = useState("");
  const [option, setOption] = useState(0);
  
  const [secretBtnDisabled, setSecretBtnDisabled] = useState(false);
  const [optionBtnDisabled, setOptionBtnDisabled] = useState(false);
  const [withdrawBtnDisabled, setWithdrawBtnDisabled] = useState(false);

  const data = useContractReader(readContracts, "GameContract", "rooms", [id]);
  console.log("room", id, data);

  const [step, setStep] = useState(ROOM_STEP.END);

  const [footer, setFooter] = useState(null);

  const handleCancel = () => setVisible(false);

  const cancelBtn = (
    <Button key="cancel" onClick={handleCancel}>
      Cancel
    </Button>
  );

  const withdrawBtn = (
    <Button
      type="primary"
      danger
      key="withdraw"
      disabled={withdrawBtnDisabled}
      onClick={async () => {
        setWithdrawBtnDisabled(true);
        await tx(writeContracts.GameContract.withdraw(data.id));
        setWithdrawBtnDisabled(false);
      }}
    >
      Withdraw
    </Button>
  );

  const handleSendHashcode = async () => {
    setOptionBtnDisabled(true);
    const hashcode = sha256(`${secret}${option}`);
    await tx(writeContracts.GameContract.sendHashcode(data.id, hashcode, { value: data.betAmount + "" }));
    setOptionBtnDisabled(false);
  };

  const handleSendSecret = async () => {
    setSecretBtnDisabled(true);
    await tx(writeContracts.GameContract.sendSecret(data.id, secret));
    setSecretBtnDisabled(false);
  };

  useEffect(() => {
    if (data) {
      if (data.status === ROOM_STATUS.ONE_PLAYER) {
        setStep(ROOM_STEP.CHOOSE_OPTION);
      } else if (data.status === ROOM_STATUS.TWO_PLAYERS) {
        const playerNum = address === data.address_1 ? 1 : address === data.address_2 ? 2 : 0
        if (playerNum) {
          if (data[`hashcode_${playerNum}`] === constants.HashZero) {
            setStep(ROOM_STEP.CHOOSE_OPTION);
          } else if (!data[`choose_${playerNum}`].toNumber()) {
            setStep(ROOM_STEP.SEND_KEY);
          }
        }
      } else {
        setStep(ROOM_STEP.END);
      }
    }
  }, [data, address]);

  useEffect(() => {
    setOptionBtnDisabled(!option);
  }, [option]);

  useEffect(() => {
    if (step === ROOM_STEP.CHOOSE_OPTION) {
      setFooter([
        cancelBtn,
        withdrawBtn,
        <Button key="option" type="primary" onClick={handleSendHashcode} disabled={optionBtnDisabled}>
          Send option
        </Button>,
      ])
    } else if (step === ROOM_STEP.SEND_KEY) {
      setFooter([
        cancelBtn,
        withdrawBtn,
        <Button key="secret" type="primary" onClick={handleSendSecret} disabled={secretBtnDisabled}>
          Send secret key
        </Button>,
      ])
    } else {
      setFooter(null)
    }
  }, [step, optionBtnDisabled, secretBtnDisabled]);

  return (
    <Modal
      title={`Room ${id}`}
      centered
      visible={visible}
      onCancel={handleCancel}
      footer={footer}
      // width={1000}
    >
      {data && (
        <>
          <div>
            <div style={{ marginBottom: 15 }}>
              Bet amount: {data.token === "" ? utils.formatEther(data.betAmount) : data.betAmount.toNumber()}{" "}
              {data.token === "" ? "ETH" : data.token}
              {data.token !== "" && data.status === ROOM_STATUS.ONE_PLAYER && (
                <TokenApproval
                  symbol={data.token}
                  tx={tx}
                  readContracts={readContracts}
                  writeContracts={writeContracts}
                  amount={data.betAmount}
                />
              )}
            </div>
            <Row>
              <Col span={12}>
                Player 1: <Address value={data.address_1} fontSize={16} />
              </Col>
              {data.address_2 !== constants.AddressZero && (
                <Col span={12}>
                  Player 2: <Address value={data.address_2} fontSize={16} />
                </Col>
              )}
            </Row>
          </div>
          {data.result === ROOM_RESULT.UNDECIDED && data.status !== ROOM_STATUS.EMPTY && (
            <>
              <Form labelCol={{ span: 6 }} wrapperCol={{ span: 14 }} layout="horizontal" style={{ marginTop: "30px" }}>
                <Form.Item label="Secret Key">
                  <Input
                    value={secret}
                    disabled={step !== ROOM_STEP.CHOOSE_OPTION}
                    onChange={e => setSecret(e.target.value)}
                  />
                </Form.Item>
              </Form>
              <h4>Select an option:</h4>
              <Row>
                {PLAYER_OPTIONS.map((_option) => (
                  <Col
                    span={8}
                    key={_option.id}
                    onClick={() => step === ROOM_STEP.CHOOSE_OPTION && setOption(_option.id)}
                    style={{ textAlign: "center" }}
                  >
                    <img
                      src={_option.imageSrc}
                      alt={_option.id}
                      width={100}
                      height={100}
                      style={{ border: option === _option.id ? "1px solid red" : "" }}
                    />
                  </Col>
                ))}
              </Row>
            </>
          )}
          {data.result !== ROOM_RESULT.UNDECIDED && (
            <>
              <Row>
                <Col span={12} style={{ textAlign: "center" }}>
                  <img
                    src={PLAYER_OPTIONS.find(o => o.id === data.choose_1.toNumber()).imageSrc}
                    alt={""}
                    width={75}
                    height={75}
                  />
                </Col>
                <Col span={12} style={{ textAlign: "center" }}>
                  <img
                    src={PLAYER_OPTIONS.find(o => o.id === data.choose_2.toNumber()).imageSrc}
                    alt={""}
                    width={75}
                    height={75}
                  />
                </Col>
              </Row>
              <h2 style={{ textAlign: "center", marginTop: 20 }}>
                {data.result === ROOM_RESULT.WINNER_1 && <p>Player 1 win</p>}
                {data.result === ROOM_RESULT.DRAW && <p>Draw</p>}
                {data.result === ROOM_RESULT.WINNER_2 && <p>Player 2 win</p>}
              </h2>
            </>
          )}
        </>
      )}
    </Modal>
  )
}

export default Room;