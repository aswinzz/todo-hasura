import Link from 'next/link'
import fetch from 'isomorphic-unfetch'
import React from 'react'
import gql from 'graphql-tag'
import { Query, Mutation, Subscription } from "react-apollo";
import withData from '../config';
import TodoList from '../components/todolist';
import Head from 'next/head';
import { Button,PageHeader,Tabs,Tab,Panel,Row,Col,Navbar,Table,Nav,NavDropdown } from 'react-bootstrap';
import Router from 'next/router'


const SUBSCRIPTION_ONLINE_USERS = gql`
  subscription {
    online(order_by: { username: asc }) {
      username
    }
  }
`;

const MUTATION_ONLINE_DELETE = `
  mutation delete_online($username: String) {
    delete_online(where: { username: { _eq: $username } }) {
      affected_rows
    }
  }
`;
    

const ADD_TODO = gql`
   mutation ($text: String!,$created_at: String!,$user_id: String!,$is_public: Boolean!) {
    insert_todos(objects: [
      {
        text: $text
        user_id: $user_id
        created_at: $created_at
        is_public: $is_public
      }]) {
      returning {
        id
      }
    }
  }
`;




class Index extends React.Component {
  constructor (props) {
    super(props);
    this.state={
      loggedIn:false,
      text:"",
      public:false
    }
    this.logout=this.logout.bind(this);
    this.textChange=this.textChange.bind(this);
    this.addTodo=this.addTodo.bind(this);
    this.checkPrivate=this.checkPrivate.bind(this);
  }

  checkPrivate(e){
    if(e.target.value=="public"){
      this.setState({public:true});
    }
  }
  addTodo(){
    if(this.state.text==""){
      alert("Text field cannot be empty");
    }
    else{
      console.log(Date.now())
    }
  }

  textChange(e){
    this.setState({text:e.target.value});
  }


  componentDidMount(){
    console.log(localStorage.getItem("username"))
    if(localStorage.getItem("username")){
      this.setState({
        loggedIn:true,
        user_id:localStorage.getItem("user_id"),
        public:false
      });
    }
    else{
      this.setState({
        loggedIn:false
      });
    }
  }

  logout(){
    var username="";
    fetch('https://auth.condense57.hasura-app.io/v1/user/logout', {
                method: 'POST',
                headers : {
                  "Content-Type":"application/json",
                  "Authorization":`Bearer ${localStorage.getItem("auth_token")}`
                },
            }).then((res) => res.json())
            .then((data) =>  {
                console.log(data);
                this.setState({loggedIn:false});
                localStorage.removeItem("auth_token");
                username=localStorage.getItem("username");
                fetch('https://data.condense57.hasura-app.io/v1alpha1/graphql', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'Authorization': `Bearer f3f938a9d6a7a2849f7193d4d74f4012f01110e28466d30b`,
                  'X-Hasura-Role': 'admin'
                },
                body: JSON.stringify({
                  query:MUTATION_ONLINE_DELETE,
                  variables: {
                      username:username,
                  }
                })
              })
                .then(r => r.json())
                .then(data => console.log('data returned:', data));
                localStorage.removeItem("username");
                localStorage.removeItem("hasura_id");
                alert(data.message);
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
        </Head>
        <Navbar bg="dark">
          <Navbar.Brand inline>Todo App</Navbar.Brand>
        </Navbar>
        {this.state.loggedIn?
        <div>
             <Button onClick={()=>this.logout()} bsStyle="primary">Logout</Button><br/>
             <input onChange={(e)=>this.textChange(e)} name="text" id="text"/>&nbsp;&nbsp;
             <input type="checkbox" name="public" id="public" onChange={(e)=>this.checkPrivate(e)} value="public"/> Public Todo &nbsp;&nbsp;
             <Mutation mutation={ADD_TODO}>
              {(AddTodo, {loading, error, data}) => {
                if (data) {
                  console.log(data);
                }
                if (loading) {
                  return (<span><Button bsStyle="primary" disabled>Loading...</Button>&nbsp;&nbsp;</span>);
                }
                if (error) {
                  return (<span><Button bsStyle="primary" >Try again: {error.toString()}</Button>&nbsp;&nbsp;</span>);
                }

                return (
                  <span>
                    <Button
                      bsStyle="primary"
                      onClick={(e) => {
                        if(this.state.text==""){
                          alert("Text field cannot be empty");
                          return;
                        }
                        AddTodo({
                          variables: {
                            text: this.state.text,
                            user_id:this.state.user_id,
                            created_at: Date.now().toString(),
                            is_public:this.state.public
                          }})
                      }}>
                      Add
                    </Button>&nbsp;&nbsp;
                  </span>
                );
              }}
            </Mutation>
              <h1>Private Todo</h1>
             <TodoList type="private"/><br/>
             <h1>Public Todo</h1>
             <TodoList type="public"/><br/>
             <Subscription subscription={SUBSCRIPTION_ONLINE_USERS}>
              {({ loading, error, data }) => {
                if (loading) {
                  return <div>Loading. Please wait...</div>;
                }
                if (error) {
                  return <div>Error loading users</div>;
                }
                return (
                  <div className="sliderMenu grayBgColor">
                    <div className="sliderHeader">
                      <h1>Online users - {data.online.length}</h1>
                    </div>
                    <Table striped hover bordered responsive>
                    <tbody>
                    {data.online.map((user, index) => {
                      return (
                        <tr key={user.username}>
                          <td>{user.username}</td>
                        </tr>
                      );
                    })}
                    </tbody>
                    </Table>
                  </div>
                );
              }}
            </Subscription>
        </div>
        :
        <div>
          <Link href={`/login`}>
                <Button bsStyle="primary">Login</Button>
          </Link><br/>
          <Link href={`/register`}>
                  <Button bsStyle="primary">Register</Button>
          </Link>
        </div>
        }
      </div>
    );
  }
}
export default withData(Index);