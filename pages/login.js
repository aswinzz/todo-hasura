import Link from 'next/link'
import fetch from 'isomorphic-unfetch'
import React from 'react'
import gql from 'graphql-tag'
import { Query, Mutation } from "react-apollo";
import withData from '../config';
import Head from 'next/head';
import { Button,PageHeader,Tabs,Tab,Panel,Row,Col } from 'react-bootstrap';
import Router from 'next/router'


const MUTATION_ONLINE_USER = `
  mutation ($username: String!) {
    insert_online(objects: [
      {
        username: $username
      }]) {
      returning {
        username
      }
    }
  }
`;
    


class Login extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      username:"",
      password:""
    };
    this.onSubmit=this.onSubmit.bind(this);
    this.onPasswordChange=this.onPasswordChange.bind(this);
    this.onUsernameChange=this.onUsernameChange.bind(this);
  }

  onUsernameChange(e){
    this.setState({username:e.target.value});
  }
  
  onPasswordChange(e){
    this.setState({password:e.target.value});
  }

  onSubmit(){
    
    // console.log(this.state.username,this.state.password);
    fetch('https://auth.condense57.hasura-app.io/v1/login', {
                method: 'POST',
                headers : {
                  "Content-Type":"application/json"
                },
                body:JSON.stringify({
                  provider:"username",
                  data:{
                    username:this.state.username, password:this.state.password
                  }
                })
            }).then((res) => res.json())
            .then((data) =>  {
              console.log(data)
              if(data.auth_token){
                localStorage.setItem("auth_token",data.auth_token);
                localStorage.setItem("username",data.username);
                localStorage.setItem("user_id",data.hasura_id);
                console.log("entered")
                fetch('https://data.condense57.hasura-app.io/v1alpha1/graphql', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer f3f938a9d6a7a2849f7193d4d74f4012f01110e28466d30b`,
                    'X-Hasura-Role': 'admin'
                  },
                  body: JSON.stringify({
                    query:MUTATION_ONLINE_USER,
                    variables: {
                        username:data.username,
                    }
                  })
                })
                  .then(r => r.json())
                  .then(data => console.log('data returned:', data));
                Router.push(`/`)
              }
              else{
                alert(data.message);
              }
            })
            .catch((err)=>console.log(err))
  }
  
  render () {
    return (
      <div>
        <Head>
          <title>Real Time TodoApp</title>
          <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous"/>
          <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css" integrity="sha384-rHyoN1iRsVXV4nD0JutlnGaslCJuC7uwjduW9SVrLvRYooPp2bWYgmgJQIXwl/Sp" crossorigin="anonymous"></link>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/instantsearch.css@7.0.0/themes/algolia-min.css"/>
        </Head>
          <input onChange={(e)=>this.onUsernameChange(e)} name="username" id="username"/><br/>
          <input onChange={(e)=>this.onPasswordChange(e)} name="password" id="password" type="password"/><br/>
          <Button bsStyle="primary" onClick={()=>this.onSubmit()}>Login</Button>
      </div>
    );
  }
}
export default withData(Login);