import Link from 'next/link'
import fetch from 'isomorphic-unfetch'
import React from 'react'
import gql from 'graphql-tag'
import { Query, Mutation, Subscription } from "react-apollo";
import Head from 'next/head';
import { Button,ButtonGroup,PageHeader,Tabs,Tab,Panel,Row,Col,Navbar,Nav,NavDropdown,Table } from 'react-bootstrap';
import Router from 'next/router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'

library.add(faTimes)

const MUTATION_TODO_UPDATE = gql`
  mutation update_todos($id: Int!, $set: todos_set_input!) {
    update_todos(where: { id: { _eq: $id } }, _set: $set) {
      affected_rows
    }
  }
`;


const query = gql`
   subscription fetch_todos($user_id: String!) {
    todos(where: {user_id: {_eq: $user_id}}, order_by: { created_at: asc}) {
      id
      text
      is_completed
      is_public
      created_at
    }
  }
`

const public_query = gql`
   subscription fetch_todos {
    todos(where: {is_public: {_eq: true}}, order_by: { created_at: asc}) {
      id
      text
      is_completed
      created_at
    }
  }
`

const MUTATION_TODO_DELETE = gql`
  mutation delete_todos($id: Int) {
    delete_todos(where: { id: { _eq: $id } }) {
      affected_rows
    }
  }
`;
    

class TodoList extends React.Component {
  constructor (props) {
    super(props);
    this.state={
        username:localStorage.getItem("username"),
        user_id:localStorage.getItem("user_id"),
        filter_public:"all",
        filter_private:"all"
    };

    this.all=this.all.bind(this);
    this.active=this.active.bind(this);
    this.completed=this.completed.bind(this);

  }

  all(type_var){
      if(type_var=="public"){
          this.setState({filter_public:"all"});
      }
      else{
        this.setState({filter_private:"all"});
      }
  }

    active(type_var){
        if(type_var=="public"){
            this.setState({filter_public:"active"});
        }
        else{
        this.setState({filter_private:"active"});
        }
    }

    completed(type_var){
        if(type_var=="public"){
            this.setState({filter_public:"completed"});
        }
        else{
        this.setState({filter_private:"completed"});
        }
    }



  componentDidMount(){

  }

  render () {
    return (
      <div>
       {this.props.type=="private"?
        <Subscription
        subscription={query} variables={{user_id: this.state.user_id}}>
        {({loading, error, data}) => {
            if (loading) return "Loading...";
            if (error) return `Error!: ${error}`;
            if (data.todos.length === 0) {
            return "No Todos yet."
            } else {
            
            const that=this;
            const filtered_todos = data.todos.filter(function(obj) {
                if(that.state.filter_private=="all")
                    return obj.is_completed||!obj.completed;
                else if(that.state.filter_private=="completed")
                    return obj.is_completed;
                else
                    return !obj.is_completed;
              });
            const todos = filtered_todos.map((o, i) => (
                <tr key={i}>
                <td>
                    {Date(o.created_at).toString().split(" ")[0]+" "+Date(o.created_at).toString().split(" ")[1]+" "+Date(o.created_at).toString().split(" ")[2]+" "+Date(o.created_at).toString().split(" ")[3]}
                </td>
                <td>{o.id}</td>
                <td>
                    {o.text}
                </td>
                <td>
                    {o.is_completed?"Completed":"Not Completed"}
                </td>
                <td>
                <Mutation mutation={MUTATION_TODO_UPDATE}>
                {(CompleteTodo, {loading, error, data}) => {
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
                            CompleteTodo({
                            variables: {
                                id: o.id,
                                set: {
                                    is_completed: !o.is_completed
                                  }
                            }})
                        }}>
                        {o.is_completed?"Revert":"Complete"}
                        </Button>&nbsp;&nbsp;
                    </span>
                    );
                }}
                </Mutation>
                </td>
                <td>
                <Mutation mutation={MUTATION_TODO_DELETE}>
                {(DeleteTodo, {loading, error, data}) => {
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
                            DeleteTodo({
                            variables: {
                                id: o.id
                            }})
                        }}>
                        <FontAwesomeIcon icon="times" />
                        </Button>&nbsp;&nbsp;
                    </span>
                    );
                }}
                </Mutation>
                
                </td>
                </tr>));
            return (
                <Table striped hover bordered responsive>
                <thead>
                    <tr><th>Created</th><th>ID</th><th>Text</th><th>Status</th><th>Complete</th><th>Delete</th></tr>
                </thead>
                <tbody>
                    {todos}
                </tbody>
                <ButtonGroup aria-label="Basic example">
                    <Button onClick={()=>this.all("private")} variant="secondary">All</Button>
                    <Button onClick={()=>this.active("private")} variant="secondary">Active</Button>
                    <Button onClick={()=>this.completed("private")} variant="secondary">Completed</Button>
                </ButtonGroup>
                </Table>
            );
            }
        }}
        </Subscription>:
         <Subscription
         subscription={public_query} variables={{}}>
         {({loading, error, data}) => {
             if (loading) return "Loading...";
             if (error) return `Error!: ${error}`;
             if (data.todos.length === 0) {
             return "No Todos yet."
             } else {

            const that=this;
            const filtered_todos = data.todos.filter(function(obj) {
                if(that.state.filter_public=="all")
                    return obj.is_completed||!obj.completed;
                else if(that.state.filter_public=="completed")
                    return obj.is_completed;
                else
                    return !obj.is_completed;
                });
             const todos = filtered_todos.map((o, i) => (
                 <tr key={i}>
                 <td>
                     {Date(o.created_at).toString().split(" ")[0]+" "+Date(o.created_at).toString().split(" ")[1]+" "+Date(o.created_at).toString().split(" ")[2]+" "+Date(o.created_at).toString().split(" ")[3]}
                 </td>
                 <td>{o.id}</td>
                 <td>
                     {o.text}
                 </td>
                 <td>
                     {o.is_completed?"Completed":"Not Completed"}
                 </td>
                 <td>
                 <Mutation mutation={MUTATION_TODO_UPDATE}>
                 {(CompleteTodo, {loading, error, data}) => {
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
                            CompleteTodo({
                            variables: {
                                id: o.id,
                                set: {
                                    is_completed: !o.is_completed
                                  }
                            }})
                        }}>
                        {o.is_completed?"Revert":"Complete"}
                        </Button>&nbsp;&nbsp;
                    </span>
                     );
                 }}
                 </Mutation>
                 </td>
                 <td>
                 <Mutation mutation={MUTATION_TODO_DELETE}>
                 {(DeleteTodo, {loading, error, data}) => {
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
                             DeleteTodo({
                             variables: {
                                 id: o.id
                             }})
                         }}>
                         <FontAwesomeIcon icon="times" />
                         </Button>&nbsp;&nbsp;
                     </span>
                     );
                 }}
                 </Mutation>
                 
                 </td>
                 </tr>));
             return (
                 <Table striped hover bordered responsive>
                 <thead>
                     <tr><th>Created</th><th>ID</th><th>Text</th><th>Status</th><th>Complete</th><th>Delete</th></tr>
                 </thead>
                 <tbody>
                     {todos}
                 </tbody>
                 <ButtonGroup aria-label="Basic example">
                    <Button onClick={()=>this.all("public")} variant="secondary">All</Button>
                    <Button onClick={()=>this.active("public")} variant="secondary">Active</Button>
                    <Button onClick={()=>this.completed("public")} variant="secondary">Completed</Button>
                </ButtonGroup>
                 </Table>
             );
             }
         }}
         </Subscription>
    
        }
      </div>
    );
  }
}
export default TodoList;