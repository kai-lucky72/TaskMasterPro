import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { User, Message } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

import MessageForm from "./MessageForm";
import UserAvatar from "@/components/layout/UserAvatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Users, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MessageListProps {
  onBack?: () => void;
  isMobile?: boolean;
}

export default function MessageList({ onBack, isMobile = false }: MessageListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch available contacts
  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ['/api/messages/contacts'],
  });
  
  // Fetch conversation when a contact is selected
  const { data: conversationData, isLoading: conversationLoading } = useQuery({
    queryKey: ['/api/messages', selectedContact?.id],
    enabled: !!selectedContact,
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData: { receiverId: number; content: string }) => 
      apiRequest('POST', '/api/messages', messageData),
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
      // Refresh the conversation
      if (selectedContact) {
        queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedContact.id] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Message",
        description: error.message || "There was a problem sending your message.",
        variant: "destructive",
      });
    }
  });
  
  // Handle sending a message
  const handleSendMessage = (content: string) => {
    if (!selectedContact) return;
    
    sendMessageMutation.mutate({
      receiverId: selectedContact.id,
      content
    });
  };
  
  // Scroll to bottom of messages on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationData]);
  
  // Format contacts by role for grouping in the UI
  const formatContacts = () => {
    if (!contactsData?.contacts) return [];
    
    const grouped: { [key: string]: User[] } = {
      admin: [],
      manager: [],
      sales_staff: [],
      team_leader: [],
      individual_agent: [],
      sales_agent: []
    };
    
    contactsData.contacts.forEach((contact: User) => {
      if (grouped[contact.role]) {
        grouped[contact.role].push(contact);
      }
    });
    
    return Object.entries(grouped)
      .filter(([_, contacts]) => contacts.length > 0)
      .map(([role, contacts]) => ({
        role,
        contacts
      }));
  };
  
  // Format role name for display
  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="flex h-full border rounded-lg overflow-hidden">
      {/* Contacts sidebar */}
      {(!isMobile || !selectedContact) && (
        <div className={`${isMobile && selectedContact ? 'hidden' : 'block'} w-full md:w-64 bg-white border-r`}>
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Conversations</h2>
          </div>
          
          <ScrollArea className="h-[calc(100vh-13rem)]">
            {contactsLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center space-x-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-slate-200 rounded"></div>
                      <div className="h-3 w-16 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : formatContacts().length > 0 ? (
              <div>
                {formatContacts().map(group => (
                  <div key={group.role}>
                    {group.contacts.length > 0 && (
                      <>
                        <div className="px-4 py-2 bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {formatRole(group.role)}
                        </div>
                        
                        <div>
                          {group.contacts.map(contact => (
                            <button
                              key={contact.id}
                              className={cn(
                                "w-full text-left p-3 hover:bg-slate-50 transition-colors flex items-center space-x-3",
                                selectedContact?.id === contact.id ? "bg-slate-100" : ""
                              )}
                              onClick={() => setSelectedContact(contact)}
                            >
                              <UserAvatar user={contact} />
                              <div>
                                <p className="font-medium text-sm">{contact.firstName} {contact.lastName}</p>
                                <p className="text-xs text-slate-500 truncate">{contact.email}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                <Users className="h-8 w-8 text-slate-400 mb-2" />
                <h3 className="font-medium text-slate-700">No Contacts</h3>
                <p className="text-sm text-slate-500 mt-1">
                  No contacts available for messaging based on your role.
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      )}
      
      {/* Conversation area */}
      {isMobile && !selectedContact ? null : (
        <div className="flex-1 flex flex-col bg-white">
          {selectedContact ? (
            <>
              <div className="p-3 border-b flex items-center">
                {isMobile && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="mr-2" 
                    onClick={() => onBack ? onBack() : setSelectedContact(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
                <UserAvatar user={selectedContact} className="mr-3" />
                <div>
                  <h2 className="font-medium">{selectedContact.firstName} {selectedContact.lastName}</h2>
                  <p className="text-xs text-slate-500">{formatRole(selectedContact.role)}</p>
                </div>
              </div>
              
              <ScrollArea className="flex-1 p-4 bg-slate-50">
                {conversationLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${i % 2 === 0 ? 'bg-blue-100' : 'bg-white'} animate-pulse h-12`}></div>
                      </div>
                    ))}
                  </div>
                ) : conversationData?.messages?.length > 0 ? (
                  <div className="space-y-3">
                    {conversationData.messages.map((message: Message) => (
                      <div 
                        key={message.id} 
                        className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={cn(
                            "max-w-[80%] p-3 rounded-lg shadow-sm",
                            message.senderId === user?.id 
                              ? "bg-blue-100 text-blue-900" 
                              : "bg-white text-slate-800"
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="h-8 w-8 text-slate-400 mb-2" />
                    <h3 className="font-medium text-slate-700">No Messages Yet</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Start the conversation by sending a message.
                    </p>
                  </div>
                )}
              </ScrollArea>
              
              <div className="p-3 border-t">
                <MessageForm 
                  onSendMessage={handleSendMessage} 
                  isSubmitting={sendMessageMutation.isPending} 
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <MessageSquare className="h-12 w-12 text-slate-300 mb-3" />
              <h2 className="text-lg font-medium text-slate-700">Select a Conversation</h2>
              <p className="text-sm text-slate-500 mt-1 max-w-xs">
                Choose a contact from the list to start messaging.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
