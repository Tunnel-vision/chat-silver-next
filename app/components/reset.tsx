"use client";
import React, { useState } from "react";
import { Form, Input, Button, message, Space } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FlagFilled, LockOutlined, UserOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAccessStore } from "../store/access";
// import { loginin } from '../../Api/chatgpt'

const WrapDiv = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  align-content: center;
  background-color: #fff;
`;
const LoginRegion = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 6px;
  width: 40%;
  /* height: 400px; */
  box-shadow: 0 0 6px 0 rgba(0, 0, 0, 0.25);
  padding: 10px 20px;
  @media screen and (max-width: 600px) {
    width: 80%;
    /* height: 550px; */
  }
`;

const WrapForm = styled(Form)``;
const LegendTitle = styled.div`
  font-size: 32px;
  font-weight: 700;
  /* margin-bottom: 10px; */
  color: rgba(0, 0, 0, 0.4);
`;

export function ResetPage() {
  let location = useLocation();
  const router = useRouter();
  const access = useAccessStore();
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(60);
  const [isShowCode, setIsShowCode] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  let fromPath = location.state?.from?.pathname || "/";

  const updatePassword = async (values: any, callback: () => void) => {
    setLoading(true);
    fetch("/backend/verify_code", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    })
      .then((response) => response.json())
      .then((response) => {
        setLoading(false);
        if (response.code === 0) {
          console.log("----> response", response);
          message.success("修改密码成功");
          callback();
        } else {
          message.success("保存失败");
        }
      })
      .catch((error) => {
        message.error("保存失败");
        localStorage.setItem("user", "");
        setLoading(false);
      });
  };

  function handleSubmit(values: any) {
    console.log("---value", values);
    updatePassword(values, () => {
      localStorage.setItem("user", "");
      navigate(fromPath, { replace: true });
    });
  }

  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };

  //发送邮箱验证码
  const sendEmail = async () => {
    const fileds = await form.validateFields(["username"]);
    console.log(11, fileds);
    if (isShowCode) {
      // 倒计时未结束,不能重复点击
      return;
    }
    setIsShowCode(true);
    //倒计时
    const active = setInterval(() => {
      setTime((preSecond) => {
        if (preSecond <= 1) {
          setIsShowCode(false);
          clearInterval(active);
          // 重置秒数
          return 60;
        }
        return preSecond - 1;
      });
    }, 1000);

    // 发送请求
    fetch("/backend/generate_code", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fileds),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.code === 0) {
          message.success(`验证码已经发送到${response.data?.email}`);
        } else if (response.code === -1001) {
          message.error("用户名不存在");
          setIsShowCode(false);
          clearInterval(active);
          setTime(60);
        } else {
          message.error(response?.msg);
          setIsShowCode(false);
          clearInterval(active);
          setTime(60);
        }
      })
      .catch((error) => {
        message.error("邮件发送失败，请稍后重试");
        setIsShowCode(false);
        clearInterval(active);
        setTime(60);
      });
  };

  return (
    <WrapDiv>
      <LoginRegion>
        <LegendTitle>重置密码</LegendTitle>
        <WrapForm
          name="basic"
          form={form}
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 600 }}
          onFinish={handleSubmit}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              {
                required: true,
                message: "请输入用户名",
              },
            ]}
          >
            <Input
              prefix={<UserOutlined rev={undefined} />}
              placeholder="输入用户名"
            />
          </Form.Item>

          <Form.Item
            name="code"
            label="验证码"
            rules={[{ required: true, message: "请输入邮箱验证码！" }]}
          >
            <Input
              placeholder="请输入邮箱验证码"
              maxLength={6}
              suffix={
                <a onClick={() => sendEmail()}>
                  {isShowCode ? `${time}秒后重新发送` : "发送验证码"}
                </a>
              }
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="新密码"
            rules={[
              {
                required: true,
                message: "请输入您的新密码",
              },
              {
                min: 4,
                message: "密码位数载4-20之间",
              },
              {
                max: 20,
                message: "密码位数载4-20之间",
              },
            ]}
            // hasFeedback
          >
            <Input
              prefix={<LockOutlined rev={undefined} />}
              placeholder="输入密码"
              type="password"
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            name="confirm"
            label="确认密码"
            dependencies={["password"]}
            // hasFeedback
            rules={[
              {
                required: true,
                message: "请再次输入您的新密码",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("两次密码必须一致"));
                },
              }),
            ]}
          >
            <Input
              prefix={<LockOutlined rev={undefined} />}
              placeholder="输入密码"
              type="password"
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                style={{ width: "100%" }}
                loading={loading}
              >
                确定
              </Button>
            </Space>
          </Form.Item>
        </WrapForm>
      </LoginRegion>
    </WrapDiv>
  );
}
