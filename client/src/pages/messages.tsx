import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RoleGuard from '@/components/common/RoleGuard';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, RefreshCw, Send, User as UserIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  isRead: boolean;
  sender?: {
    firstName: string;
    lastName: string;
    workId: string;
    role: string;
  };
  receiver?: {
    firstName: string;
    lastName: string;
    workId: string;
    role: string;
  };
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');

  // Fetch contacts (users you can message)
  const {
    data: contacts,
    isLoading: isLoadingContacts,
    error: contactsError,
  } = useQuery({
    queryKey: ['/api/contacts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/contacts');
      const data = await response.json();
      return data.contacts || [];
    },
    enabled: !!user,
  });

  // Fetch conversation with selected user
  const {
    data: messages,
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['/api/messages', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return [];
      const response = await apiRequest(
        'GET',
        `/api/messages/conversation/${selectedUser.id}`
      );
      const data = await response.json();
      return data.messages || [];
    },
    enabled: !!user && !!selectedUser,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: number; content: string }) => {
      const response = await apiRequest('POST', '/api/messages', data);
      return response.json();
    },
    onSuccess: () => {
      setMessageText('');
      refetchMessages();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error.message || 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (selectedUser && messages && messages.length > 0) {
      const unreadMessages = messages.filter(
        (msg: Message) => !msg.isRead && msg.senderId === selectedUser.id
      );

      if (unreadMessages.length > 0) {
        // Call mark as read API
        apiRequest('PUT', `/api/messages/mark-read/${selectedUser.id}`)
          .then(() => {
            refetchMessages();
          })
          .catch((error) => {
            console.error('Failed to mark messages as read:', error);
          });
      }
    }
  }, [selectedUser, messages, refetchMessages]);

  // Handle send message
  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedUser) return;

    sendMessageMutation.mutate({
      receiverId: selectedUser.id,
      content: messageText,
    });
  };

  // Get initials for avatar fallback
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  // Get unread message count for a contact
  const getUnreadCount = (contactId: number) => {
    if (!messages) return 0;
    return messages.filter(
      (msg: Message) => !msg.isRead && msg.senderId === contactId
    ).length;
  };

  if (contactsError) {
    return (
      <DashboardLayout>
        <div className="p-4">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>Failed to load contacts</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                {contactsError instanceof Error
                  ? contactsError.message
                  : 'An unexpected error occurred'}
              </p>
              <Button
                className="mt-4"
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ['/api/contacts'] })
                }
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Determine the allowed roles based on the application requirements
  const allowedRoles = [
    'manager',
    'sales_staff',
    'individual_agent',
    'team_leader',
    'sales_agent',
  ];

  return (
    <RoleGuard allowedRoles={allowedRoles} redirect="/">
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
            <p className="text-muted-foreground">
              Communicate with your team members and colleagues.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
            {/* Contacts List */}
            <Card className="md:col-span-1 overflow-hidden">
              <CardHeader className="px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Contacts</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() =>
                      queryClient.invalidateQueries({
                        queryKey: ['/api/contacts'],
                      })
                    }
                    disabled={isLoadingContacts}
                  >
                    {isLoadingContacts ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <ScrollArea className="h-[calc(100vh-15rem)]">
                <div className="p-2">
                  {isLoadingContacts ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : contacts && contacts.length > 0 ? (
                    contacts.map((contact: User) => (
                      <div
                        key={contact.id}
                        className={cn(
                          'flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors',
                          selectedUser?.id === contact.id
                            ? 'bg-slate-100'
                            : 'hover:bg-slate-50'
                        )}
                        onClick={() => setSelectedUser(contact)}
                      >
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(
                              contact.firstName,
                              contact.lastName
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                          <p className="font-medium text-sm truncate">
                            {contact.firstName} {contact.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {contact.role
                              .replace('_', ' ')
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </p>
                        </div>
                        {getUnreadCount(contact.id) > 0 && (
                          <div className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs">
                            {getUnreadCount(contact.id)}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-muted-foreground">
                      No contacts found.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>

            {/* Message Area */}
            <Card className="md:col-span-3 flex flex-col overflow-hidden">
              {selectedUser ? (
                <>
                  <CardHeader className="px-4 py-3 border-b">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(
                            selectedUser.firstName,
                            selectedUser.lastName
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {selectedUser.firstName} {selectedUser.lastName}
                        </CardTitle>
                        <CardDescription>
                          {selectedUser.role
                            .replace('_', ' ')
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <ScrollArea className="flex-1 p-4">
                    {isLoadingMessages ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : messagesError ? (
                      <div className="text-center py-4 text-destructive">
                        Failed to load messages.
                        <Button
                          variant="link"
                          onClick={() => refetchMessages()}
                          className="ml-2"
                        >
                          Retry
                        </Button>
                      </div>
                    ) : messages && messages.length > 0 ? (
                      <div className="space-y-4">
                        {messages.map((message: Message) => {
                          const isFromMe = message.senderId === user?.id;
                          return (
                            <div
                              key={message.id}
                              className={cn(
                                'flex gap-2 max-w-[80%]',
                                isFromMe
                                  ? 'ml-auto flex-row-reverse'
                                  : 'mr-auto'
                              )}
                            >
                              {!isFromMe && (
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(
                                      selectedUser.firstName,
                                      selectedUser.lastName
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div
                                className={cn(
                                  'rounded-lg px-3 py-2 text-sm',
                                  isFromMe
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                )}
                              >
                                <p>{message.content}</p>
                                <p
                                  className={cn(
                                    'text-xs mt-1',
                                    isFromMe
                                      ? 'text-primary-foreground/70'
                                      : 'text-muted-foreground'
                                  )}
                                >
                                  {format(
                                    new Date(message.createdAt),
                                    'h:mm a'
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <UserIcon className="h-10 w-10 mb-2 text-muted" />
                        <p>No messages yet.</p>
                        <p className="text-sm">Start the conversation!</p>
                      </div>
                    )}
                  </ScrollArea>

                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={
                          !messageText.trim() ||
                          sendMessageMutation.isPending
                        }
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        <span className="ml-2">Send</span>
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <UserIcon className="h-12 w-12 mb-4 text-muted" />
                  <p className="text-lg font-medium">No conversation selected</p>
                  <p className="text-sm">Choose a contact to start messaging</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
