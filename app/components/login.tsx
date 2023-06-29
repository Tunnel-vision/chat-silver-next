"use client";
import React, { SyntheticEvent, useState } from "react";
import { Form, Input, Button, message, Space } from "antd";
import { useLocation } from "react-router-dom";
// import useModelContext from "../../models";
import styled from "styled-components";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAccessStore } from "../store/access";
import Cookies from "js-cookie";
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
  height: 300px;
  box-shadow: 0 0 6px 0 rgba(0, 0, 0, 0.25);
  @media screen and (max-width: 600px) {
    width: 80%;
    height: 380px;
  }
`;

const WrapForm = styled(Form)``;
const LegendTitle = styled.div`
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 10px;
  color: rgba(0, 0, 0, 0.4);
`;

export function LoginPage() {
  let location = useLocation();
  const router = useRouter();
  const access = useAccessStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  let fromPath = location.state?.from?.pathname || "/";

  function handleSubmit(values: any) {
    localStorage.setItem("user", "");
    setLoading(true);
    fetch("/backend/login/v1/login", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.code === 0) {
          access.updateUser(response.data.usename);
          setLoading(false);
          localStorage.setItem("user", response.data.username || "");
          localStorage.setItem("token", response.data.token || "");
          Cookies.set("token", response.data.token || "");
          window.location.href = `/#${fromPath}` || "/";
        } else {
          setLoading(false);
          localStorage.setItem("user", "");
          localStorage.setItem("token", "");
          Cookies.set("token", "");
          message.error("账号或密码错误，请重新尝试");
        }
        // navigate(fromPath, { replace: true })
        // router.refresh();
      })
      .catch((error) => {
        message.error("账号或密码错误，请重新尝试");
        localStorage.setItem("user", "");
        localStorage.setItem("token", "");
        Cookies.set("token", "");
        setLoading(false);
      });
    // signin(values, () => {
    //   navigate(fromPath, { replace: true })
    // })
  }

  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };

  const onForwardForgot = (e: SyntheticEvent<Element, Event>) => {
    e.stopPropagation();
    e.preventDefault();
    // router.push("/#/reset",{forceOptimisticNavigation:true})
    window.location.href = "/#/reset";
  };

  return (
    <WrapDiv>
      <LoginRegion>
        <LegendTitle>登陆页面</LegendTitle>
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
            label="用户名"
            name="username"
            rules={[{ required: true, message: "用户名不能为空" }]}
          >
            <Input
              prefix={<UserOutlined rev={undefined} />}
              placeholder="输入用户名"
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            label="密码"
            name="pwd"
            rules={[{ required: true, message: "密码不能为空" }]}
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
                登陆
              </Button>
              <Button
                type="link"
                htmlType="submit"
                style={{ width: "100%" }}
                loading={loading}
                onClick={onForwardForgot}
              >
                忘记密码
              </Button>
            </Space>
          </Form.Item>
        </WrapForm>
      </LoginRegion>
    </WrapDiv>
  );
}
